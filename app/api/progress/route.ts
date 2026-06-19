import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { progress } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId))
      .orderBy(desc(progress.lastPracticed));

    return NextResponse.json(userProgress);
  } catch (error) {
    console.error("[PROGRESS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
