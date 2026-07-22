// src/services/user.service.ts

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { RegisterInput } from "@/lib/validations/auth";

export const userService = {

  async getAll(filters?: { departmentId?: string; status?: string }) {
    const where: any = {};

    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.status)       where.status       = filters.status;

    return prisma.user.findMany({
      where,
      select: {
        id:           true,
        name:         true,
        email:        true,
        image:        true,
        role:         true,
        status:       true,
        departmentId: true,
        createdAt:    true,
        department:   { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.user.findUnique({
      where:  { id },
      select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    });
  },

  async create(data: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already in use");

    const password = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data:   { name: data.name, email: data.email, password },
      select: { id: true, name: true, email: true, role: true },
    });
  },
};