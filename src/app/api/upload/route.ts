import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseTxtToTipTap } from "@/lib/parsers/txt-parser";
import { parseMdToTipTap } from "@/lib/parsers/md-parser";
import { parseDocxToTipTap } from "@/lib/parsers/docx-parser";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ["txt", "md", "docx"];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    const filename = file.name || "Uploaded Document";
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          error: `Unsupported file format (.${extension}). Supported formats: .txt, .md, .docx`,
        },
        { status: 400 }
      );
    }

    // Clean title from filename (strip extension)
    const title = filename.replace(/\.[^/.]+$/, "") || "Untitled Document";

    let tiptapContent: any;

    try {
      if (extension === "txt") {
        tiptapContent = await parseTxtToTipTap(file);
      } else if (extension === "md") {
        tiptapContent = await parseMdToTipTap(file);
      } else if (extension === "docx") {
        tiptapContent = await parseDocxToTipTap(file);
      }
    } catch (parseError) {
      console.error("File parsing error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse document content. The file might be corrupted." },
        { status: 422 }
      );
    }

    // Create document in database
    const document = await prisma.document.create({
      data: {
        title,
        content: tiptapContent,
        ownerId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        documentId: document.id,
        title: document.title,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing the file upload." },
      { status: 500 }
    );
  }
}
