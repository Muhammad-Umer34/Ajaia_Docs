import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch documents owned by the user
    const owned = await prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
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
          select: {
            id: true,
            userId: true,
            permission: true,
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

    // 2. Fetch documents shared with the user
    const sharedShares = await prisma.documentShare.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          include: {
            owner: {
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

    const shared = sharedShares.map((share) => ({
      ...share.document,
      permission: share.permission,
      sharedAt: share.createdAt,
    }));

    return NextResponse.json({ owned, shared });
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled Document";
    const content = body.content || {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };

    const newDocument = await prisma.document.create({
      data: {
        title,
        content,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
