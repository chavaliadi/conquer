import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessions, messages, progress } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import Groq from "groq-sdk";
import { EVALUATION_PROMPT } from "@/lib/prompts/interviewer";

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

    const { sessionId, durationSeconds } = await req.json();

    if (!sessionId) {
      return new NextResponse("Missing session ID", { status: 400 });
    }

    // Verify session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session || session.userId !== userId) {
      return new NextResponse("Session not found or access denied", { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(session); // Already completed
    }

    // Load full transcript
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));

    if (history.length === 0) {
      const [updatedSession] = await db
        .update(sessions)
        .set({
          status: "COMPLETED",
          overallScore: 0,
          durationSeconds: durationSeconds || 0,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId))
        .returning();
      return NextResponse.json(updatedSession);
    }

    const transcriptText = history
      .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
      .join("\n\n");

    const evaluationResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EVALUATION_PROMPT },
        { role: "user", content: `Here is the interview transcript for a ${session.difficulty} difficulty session on "${session.topic}":\n\n${transcriptText}` },
      ],
      response_format: { type: "json_object" },
    });

    const reportContent = evaluationResponse.choices[0]?.message?.content || "";
    let parsedReport;
    try {
      const cleanedJson = cleanJsonString(reportContent);
      parsedReport = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("[JSON_PARSE_ERROR] Raw report content:", reportContent, parseErr);
      parsedReport = {
        overallScore: 5.0,
        dimensionScores: {
          technicalDepth: 5.0,
          specificity: 5.0,
          problemSolving: 5.0,
          communication: 5.0,
          starFormat: 5.0,
          followUpHandling: 5.0,
        },
        strengths: ["Completed the conversation session."],
        gaps: ["Evaluation generation had a parsing issue."],
        suggestions: ["Review the transcript to assess your depth and performance."],
        topicsNotCovered: [],
      };
    }

    const score = parseFloat(parsedReport.overallScore) || 0;

    // Update Session
    const [updatedSession] = await db
      .update(sessions)
      .set({
        status: "COMPLETED",
        overallScore: score,
        durationSeconds: durationSeconds || 0,
        report: parsedReport,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    // Update Aggregated Progress
    const [existingProgress] = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.topic, session.topic)));

    if (existingProgress) {
      const newCount = existingProgress.sessionsCount + 1;
      const newAvg = (existingProgress.avgScore * existingProgress.sessionsCount + score) / newCount;

      const mergedStrengths = Array.from(
        new Set([...(existingProgress.strengths as string[]), ...(parsedReport.strengths || [])])
      ).slice(0, 10);
      const mergedWeakAreas = Array.from(
        new Set([...(existingProgress.weakAreas as string[]), ...(parsedReport.gaps || [])])
      ).slice(0, 10);

      await db
        .update(progress)
        .set({
          avgScore: parseFloat(newAvg.toFixed(2)),
          sessionsCount: newCount,
          strengths: mergedStrengths,
          weakAreas: mergedWeakAreas,
          lastPracticed: new Date(),
        })
        .where(eq(progress.id, existingProgress.id));
    } else {
      await db.insert(progress).values({
        userId,
        topic: session.topic,
        avgScore: score,
        sessionsCount: 1,
        strengths: parsedReport.strengths || [],
        weakAreas: parsedReport.gaps || [],
      });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("[INTERVIEW_END_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
