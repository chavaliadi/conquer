import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Force Node.js runtime — pdf-parse requires native Node modules (fs, Buffer)
export const runtime = "nodejs";

async function parsePdf(buffer: Buffer): Promise<string> {
  // Dynamic import to keep this server-only
  // pdf-parse may export as ESM default or as CJS module root — handle both
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default ?? mod;
  const result = await pdfParse(buffer);
  return result.text;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return new NextResponse("Only PDF files are accepted", { status: 400 });
    }

    // 5MB max size guard
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File too large. Maximum 5MB.", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resumeText: string;
    try {
      resumeText = await parsePdf(buffer);
    } catch (parseError) {
      console.error("[PDF_PARSE_ERROR]", parseError);
      return new NextResponse("Failed to extract text from PDF. Ensure it is a text-based PDF.", { status: 422 });
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return new NextResponse("The PDF appears to have no readable text content.", { status: 422 });
    }

    // Upsert user and attach resume fields
    await db
      .insert(users)
      .values({
        id: userId,
        email: "",
        resumeText: resumeText.trim(),
        resumeFileName: file.name,
        resumeUploadedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          resumeText: resumeText.trim(),
          resumeFileName: file.name,
          resumeUploadedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      charCount: resumeText.trim().length,
    });
  } catch (error) {
    console.error("[RESUME_UPLOAD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db
      .update(users)
      .set({
        resumeText: null,
        resumeFileName: null,
        resumeUploadedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESUME_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ hasResume: false });
    }

    return NextResponse.json({
      hasResume: !!user.resumeText,
      fileName: user.resumeFileName || null,
      uploadedAt: user.resumeUploadedAt || null,
    });
  } catch (error) {
    console.error("[RESUME_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
