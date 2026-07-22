// src/lib/validations/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "REQUESTER"]),
}).strict();

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED", "PENDING"]),
}).strict();

export const updateUserDepartmentSchema = z.object({
  departmentId: z.string().nullable(),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
