import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { abac } from "@/lib/abac";

const registerSchema = z.object({
  name:            z.string().min(2, "Name must be at least 2 characters"),
  email:           z.string().email("Invalid email address"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    if (!abac.canManageTeam(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestedDepartmentId = searchParams.get("departmentId") ?? undefined;
    const status           = searchParams.get("status")       ?? undefined;
    const departmentId = actor.role === "MANAGER"
      ? actor.departmentId ?? "__none__"
      : requestedDepartmentId;

    const users = await userService.getAll({ departmentId, status });
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors     = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const bcrypt         = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password:     hashedPassword,
        role:         "REQUESTER",
        departmentId: null,
        status:       "PENDING",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
