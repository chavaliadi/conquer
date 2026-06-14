import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, sessions, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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

    const body = await req.json();
    const { topic, difficulty } = body;

    if (!topic || !difficulty) {
      return new NextResponse("Missing topic or difficulty", { status: 400 });
    }

    // Sync Clerk User with DB
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
    const name = `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim();

    await db.insert(users).values({
      id: userId,
      email,
      name,
    }).onConflictDoUpdate({
      target: users.id,
      set: { email, name, updatedAt: new Date() }
    });

    // Create session
    const [newSession] = await db.insert(sessions).values({
      userId,
      topic,
      difficulty,
      status: "ACTIVE",
    }).returning();

    // Generate first greeting / question
    const systemPrompt = getInterviewerPrompt({ topic, difficulty });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please introduce yourself, state the topic and difficulty, and ask the first interview question. Keep it concise (2-4 sentences max)." }
      ]
    });
    const firstQuestion = completion.choices[0]?.message?.content || "Hello! Let's begin the interview. Could you please introduce yourself and tell me a bit about your experience?";

    // Save as first assistant message
    await db.insert(messages).values({
      sessionId: newSession.id,
      role: "assistant",
      content: firstQuestion,
      turnNumber: 1,
    });

    // Update total turns in session
    await db.update(sessions)
      .set({ totalTurns: 1 })
      .where(eq(sessions.id, newSession.id));

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("[SESSIONS_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt));

    return NextResponse.json(userSessions);
  } catch (error) {
    console.error("[SESSIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
