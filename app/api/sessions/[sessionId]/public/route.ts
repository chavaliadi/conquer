import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId } = await params;
    const { isPublic } = await req.json();

    if (isPublic === undefined) {
      return new NextResponse("Missing parameter isPublic", { status: 400 });
    }

    const [updatedSession] = await db
      .update(sessions)
      .set({
        isPublic,
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning();

    if (!updatedSession) {
      return new NextResponse("Session not found or access denied", { status: 404 });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("[PUBLIC_PATCH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
