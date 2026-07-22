import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, commentId } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        ticketId: true,
        ticket: {
          select: {
            creatorId:    true,
            assigneeId:   true,
            departmentId: true,
            status:       true,
          },
        },
      },
    });

    if (!comment || comment.ticketId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const user = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    if (!abac.canViewTicket(user, {
      creatorId:    comment.ticket.creatorId,
      assigneeId:   comment.ticket.assigneeId   ?? null,
      departmentId: comment.ticket.departmentId ?? null,
      status:       comment.ticket.status,
    })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!abac.canDeleteComment(user, comment.authorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ message: "Comment deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
