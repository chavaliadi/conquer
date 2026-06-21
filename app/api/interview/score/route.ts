import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function cleanJsonString(str: string): string {
  const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : str.trim();
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId, turnNumber } = await req.json();

    if (!sessionId || turnNumber === undefined) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Verify session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session || session.userId !== userId) {
      return new NextResponse("Session not found or access denied", { status: 404 });
    }

    // Find candidate's answer at turnNumber
    const [userMessage] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.sessionId, sessionId), eq(messages.turnNumber, turnNumber)));

    if (!userMessage || userMessage.role !== "user") {
      return new NextResponse("Message not found or invalid turn", { status: 404 });
    }

    // Find preceding question at turnNumber - 1 (assistant)
    const [questionMessage] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.sessionId, sessionId), eq(messages.turnNumber, turnNumber - 1)));

    const questionContent = questionMessage?.content || "Introduce yourself and state your track.";

    // Call Groq (Llama 3.1 8B, fast) for per-question score
    const scoringResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a technical lead scoring a candidate's response to an interviewer's question. Rate the response from 0.0 to 10.0 based on technical depth, specificity, and correctness. If the candidate was vague or deflected, score it below 5.0. Also provide a single sentence of constructive, direct feedback. Return ONLY a JSON object: { \"score\": 7.5, \"feedback\": \"Good use of pagination, but mention index design.\" }",
        },
        {
          role: "user",
          content: `Interviewer Question:\n"${questionContent}"\n\nCandidate Response:\n"${userMessage.content}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const output = scoringResponse.choices[0]?.message?.content || "";
    let parsedResult;
    try {
      const cleaned = cleanJsonString(output);
      parsedResult = JSON.parse(cleaned);
    } catch (err) {
      console.error("[SCORE_PARSE_ERROR] Raw output:", output, err);
      parsedResult = {
        score: 5.0,
        feedback: "Could not evaluate response scoring.",
      };
    }

    const score = parseFloat(parsedResult.score) || 0.0;
    const feedback = parsedResult.feedback || "";

    // Update message record
    await db
      .update(messages)
      .set({
        answerScore: score,
        feedback: feedback,
      })
      .where(eq(messages.id, userMessage.id));

    return NextResponse.json({
      messageId: userMessage.id,
      score,
      feedback,
    });
  } catch (error) {
    console.error("[INTERVIEW_SCORE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
