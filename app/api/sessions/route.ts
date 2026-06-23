import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, sessions, messages, progress } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

import Groq from "groq-sdk";
import { getInterviewerPrompt, getRandomSubTopic } from "@/lib/prompts/interviewer";

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
    const { topic, difficulty, mode = "STANDARD", subTopic = null, isResumeAware = false } = body;

    if (!topic || !difficulty) {
      return new NextResponse("Missing topic or difficulty", { status: 400 });
    }

    const finalResumeAware = isResumeAware === true || isResumeAware === "true";

    let finalSubTopic = subTopic;
    if (!finalSubTopic && !finalResumeAware && (mode === "STANDARD" || mode === "QUICK_FIRE")) {
      finalSubTopic = getRandomSubTopic(topic);
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

    // Fetch user's resume (if any)
    const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
    const resumeText = userRecord?.resumeText || undefined;

    // Fetch weak areas if in WEAKNESS_TRAINER mode
    let weakAreas: string[] = [];
    if (mode === "WEAKNESS_TRAINER") {
      const [existingProgress] = await db
        .select()
        .from(progress)
        .where(and(eq(progress.userId, userId), eq(progress.topic, topic)));
      if (existingProgress && Array.isArray(existingProgress.weakAreas)) {
        weakAreas = existingProgress.weakAreas as string[];
      }
    }

    // Create session
    const [newSession] = await db.insert(sessions).values({
      userId,
      topic,
      difficulty,
      mode,
      subTopic: finalSubTopic,
      isResumeAware: finalResumeAware,
      status: "ACTIVE",
    }).returning();

    // Generate first greeting / question (resume-aware if uploaded and enabled)
    const systemPrompt = getInterviewerPrompt({
      topic,
      difficulty,
      resumeText: finalResumeAware ? resumeText : undefined,
      mode,
      subTopic: finalSubTopic,
      weakAreas,
    });

    const modelToUse = mode === "QUICK_FIRE" ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

    const completion = await groq.chat.completions.create({
      model: modelToUse,
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

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

      if (!session) {
        return new NextResponse("Session not found", { status: 404 });
      }

      return NextResponse.json(session);
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

export async function DELETE(req: Request) {
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

    // Delete session from DB ( cascade-deletes related messages in Postgres automatically )
    await db
      .delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SESSIONS_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
