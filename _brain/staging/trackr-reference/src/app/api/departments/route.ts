import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";

export async function GET(req: Request) {
  try {
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

    const departments = await prisma.department.findMany({
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: departments });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    if (!abac.canManageDepartments(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const department = await prisma.department.create({
      data: { name: body.name, description: body.description, color: body.color ?? "#7c5cfc" },
    });

    return NextResponse.json({ data: department }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
