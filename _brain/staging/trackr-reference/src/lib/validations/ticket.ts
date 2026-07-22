// src/lib/validations/ticket.ts
import { z } from "zod";

export const createTicketSchema = z.object({
  title:        z.string().min(1, "Title is required").max(200),
  description:  z.string().optional(),
  priority:     z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  tags:         z.array(z.string()).default([]),
  assigneeId:   z.string().optional(),
  departmentId: z.string().optional(),
  requestTypeId: z.string().optional(),
  customFields:  z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export const updateTicketSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  description:  z.string().optional(),
  tags:         z.array(z.string()).optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const selfAssignTicketSchema = z.object({
  selfAssign: z.literal(true),
}).strict();

export const reassignTicketSchema = z.object({
  assigneeId: z.string().nullable(),
}).strict();

export const changeTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
}).strict();

export const changeTicketPrioritySchema = z.object({
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
}).strict();

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
