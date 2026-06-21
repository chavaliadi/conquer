import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessions, messages, users, progress } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import Groq from "groq-sdk";
import { getInterviewerPrompt } from "@/lib/prompts/interviewer";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages: chatMessages, sessionId } = await req.json();

    if (!sessionId || !chatMessages || chatMessages.length === 0) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Verify session belongs to user
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session || session.userId !== userId) {
      return new NextResponse("Session not found or access denied", { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return new NextResponse("Interview is already completed", { status: 400 });
    }

    const lastMessage = chatMessages[chatMessages.length - 1];

    // Get previous messages from DB
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));

    const userTurnNumber = history.length + 1;

    // Fetch user's resume for resume-aware prompting
    const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
    const resumeText = userRecord?.resumeText || undefined;

    // Save user's message to DB
    await db.insert(messages).values({
      sessionId,
      role: "user",
      content: lastMessage.content,
      turnNumber: userTurnNumber,
    });

    if (session.mode === "QUICK_FIRE" && userTurnNumber >= 10) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("[LIMIT_REACHED]"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const allConversationMessages = [
      ...history,
      { role: "user", content: lastMessage.content }
    ];

    let finalMessages: any[] = [];

    // Fetch weak areas if in WEAKNESS_TRAINER mode
    let weakAreas: string[] = [];
    if (session.mode === "WEAKNESS_TRAINER") {
      const [existingProgress] = await db
        .select()
        .from(progress)
        .where(and(eq(progress.userId, userId), eq(progress.topic, session.topic)));
      if (existingProgress && Array.isArray(existingProgress.weakAreas)) {
        weakAreas = existingProgress.weakAreas as string[];
      }
    }

    const systemPrompt = getInterviewerPrompt({
      topic: session.topic,
      difficulty: session.difficulty,
      resumeText,
      mode: session.mode as any,
      subTopic: session.subTopic,
      weakAreas,
    });

    const systemMessage = { role: "system", content: systemPrompt };

    // Context Window Management: Summarize old turns if history is long
    if (allConversationMessages.length <= 6) {
      finalMessages = [
        systemMessage,
        ...allConversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
    } else {
      // Split older conversation and the last 4 turns
      const olderMessages = allConversationMessages.slice(0, allConversationMessages.length - 4);
      const recentMessages = allConversationMessages.slice(allConversationMessages.length - 4);

      try {
        // Run a fast, non-streaming Llama 3.1 8B call to summarize history
        const summaryResponse = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are an expert technical interviewer. Summarize the technical designs, decisions, code selections, or behavioral points made by the candidate in the following conversation history. Keep it to 2-3 sentences max. Do not add general meta-commentary.",
            },
            {
              role: "user",
              content: olderMessages
                .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
                .join("\n"),
            },
          ],
        });

        const summaryText = summaryResponse.choices[0]?.message?.content || "";
        
        finalMessages = [
          systemMessage,
          {
            role: "system",
            content: `Summary of the conversation so far:\n${summaryText}`,
          },
          ...recentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];
      } catch (e) {
        console.error("[SUMMARIZE_ERROR] Fallback to full history:", e);
        finalMessages = [
          systemMessage,
          ...allConversationMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];
      }
    }

    const modelToUse = session.mode === "QUICK_FIRE" ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

    // Call LLM for the streaming turn
    const chatCompletion = await groq.chat.completions.create({
      model: modelToUse,
      messages: finalMessages,
      stream: true,
    });

    let aiContent = "";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const text = chunk.choices[0]?.delta?.content || "";
            aiContent += text;
            controller.enqueue(encoder.encode(text));
          }

          // On successful stream finish, persist AI response
          await db.insert(messages).values({
            sessionId,
            role: "assistant",
            content: aiContent,
            turnNumber: userTurnNumber + 1,
          });

          // Update total turns in session
          await db
            .update(sessions)
            .set({
              totalTurns: userTurnNumber + 1,
              updatedAt: new Date(),
            })
            .where(eq(sessions.id, sessionId));

        } catch (error) {
          console.error("[STREAM_WRITE_ERROR]", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[INTERVIEW_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return new NextResponse("Missing session ID", { status: 400 });
    }

    // Verify session belongs to user
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session || session.userId !== userId) {
      return new NextResponse("Session not found or access denied", { status: 404 });
    }

    // Load past messages
    const pastMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(pastMessages);
  } catch (error) {
    console.error("[INTERVIEW_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

