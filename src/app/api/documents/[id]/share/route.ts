import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarColor: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the document owner can view sharing settings" }, { status: 403 });
    }

    return NextResponse.json({
      owner: document.owner,
      shares: document.shares,
    });
  } catch (error) {
    console.error("GET /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: "Failed to fetch document shares" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const targetEmail = String(body.email || "").toLowerCase().trim();
    const permission = body.permission === "edit" ? "edit" : "view";

    if (!targetEmail) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Verify current user is document owner
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the document owner can share this document" }, { status: 403 });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true, name: true, email: true, avatarColor: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email "${targetEmail}" was not found.` },
        { status: 404 }
      );
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: "You cannot share a document with yourself" }, { status: 400 });
    }

    // Upsert share record
    const share = await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: {
        permission,
      },
      create: {
        documentId: id,
        userId: targetUser.id,
        permission,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, share }, { status: 200 });
  } catch (error) {
    console.error("POST /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Target userId is required" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the document owner can revoke access" }, { status: 403 });
    }

    await prisma.documentShare.deleteMany({
      where: {
        documentId: id,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: "Failed to revoke document access" }, { status: 500 });
  }
}
