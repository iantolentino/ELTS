import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abac } from "@/lib/abac";
import { updateUserDepartmentSchema, updateUserRoleSchema, updateUserStatusSchema } from "@/lib/validations/auth";

type Params = { params: Promise<{ id: string }> };

function validationError(error: any) {
  return NextResponse.json({ error: error.flatten?.() ?? error }, { status: 400 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id }    = await params;
    const session   = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor: any = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    const body = await req.json();

    const targetUser = await prisma.user.findUnique({
      where:  { id },
      select: { id: true, role: true, departmentId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role assignment — admin only
    if ("role" in body) {
      const parsed = updateUserRoleSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canAssignRole(actor)) {
        return NextResponse.json({ error: "Only admins can assign roles" }, { status: 403 });
      }

      if (["MANAGER", "MEMBER"].includes(parsed.data.role) && !targetUser.departmentId) {
        return NextResponse.json({ error: "Assign a department before promoting this user" }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where:  { id },
        data:   {
          role: parsed.data.role,
          ...(parsed.data.role === "REQUESTER" && { departmentId: null }),
        },
        select: {
          id: true, name: true, email: true, role: true, status: true, departmentId: true,
          department: { select: { id: true, name: true, color: true } },
        },
      });
      return NextResponse.json({ data: updated });
    }

    // Status change — admin or department manager
    if ("departmentId" in body) {
      const parsed = updateUserDepartmentSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canAssignRole(actor)) {
        return NextResponse.json({ error: "Only admins can assign departments" }, { status: 403 });
      }

      if (parsed.data.departmentId) {
        const department = await prisma.department.findUnique({
          where:  { id: parsed.data.departmentId },
          select: { id: true },
        });

        if (!department) {
          return NextResponse.json({ error: "Department not found" }, { status: 400 });
        }
      }

      if (!parsed.data.departmentId && ["MANAGER", "MEMBER"].includes(targetUser.role)) {
        return NextResponse.json({ error: "Staff users must belong to a department" }, { status: 400 });
      }

      if (parsed.data.departmentId && targetUser.role === "REQUESTER") {
        return NextResponse.json({ error: "Requesters do not belong to internal departments" }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where:  { id },
        data:   { departmentId: parsed.data.departmentId },
        select: {
          id: true, name: true, email: true, role: true, status: true, departmentId: true,
          department: { select: { id: true, name: true, color: true } },
        },
      });
      return NextResponse.json({ data: updated });
    }

    if ("status" in body) {
      const parsed = updateUserStatusSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);

      if (!abac.canApproveUser(actor, targetUser?.departmentId ?? null)) {
        return NextResponse.json({ error: "Forbidden — you can only manage users in your department" }, { status: 403 });
      }

      if (actor.role === "MANAGER" && targetUser.role !== "MEMBER") {
        return NextResponse.json({ error: "Managers can only update member statuses" }, { status: 403 });
      }

      if (parsed.data.status === "ACTIVE" && ["MANAGER", "MEMBER"].includes(targetUser.role) && !targetUser.departmentId) {
        return NextResponse.json({ error: "Staff users must belong to a department before activation" }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where:  { id },
        data:   { status: parsed.data.status },
        select: { id: true, name: true, email: true, role: true, status: true },
      });
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor: any = {
      id:           session.user.id,
      role:         (session.user as any).role         ?? "REQUESTER",
      departmentId: (session.user as any).departmentId ?? null,
    };

    if (!abac.canAssignRole(actor)) {
      return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 });
    }

    if (id === actor.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        _count: {
          select: {
            createdTickets: true,
            comments: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "You cannot delete the last admin" }, { status: 400 });
      }
    }

    if (targetUser._count.createdTickets > 0 || targetUser._count.comments > 0) {
      return NextResponse.json(
        { error: "This user has ticket history. Suspend or reject the user to preserve audit records." },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { assigneeId: id },
        data:  { assigneeId: null },
      }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
