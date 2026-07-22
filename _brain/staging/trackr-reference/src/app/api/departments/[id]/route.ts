import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const includeCounts = searchParams.get("includeCounts") === "true";
    const actor = session?.user?.id
      ? {
          id:           session.user.id,
          role:         (session.user as any).role         ?? "REQUESTER",
          departmentId: (session.user as any).departmentId ?? null,
        }
      : null;

    if (includeCounts && (!actor || !abac.canManageTeam(actor))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const department = await prisma.department.findUnique({
      where: { id },
      select: {
        id:          true,
        name:        true,
        description: true,
        color:       true,
        createdAt:   true,
        ...(includeCounts && {
          _count: { select: { users: true, tickets: true } },
        }),
      },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ data: department });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}
