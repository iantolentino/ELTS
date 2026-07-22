// src/services/ticket.service.ts

import { prisma } from "@/lib/prisma";
import { generateTicketNumber } from "../utils/ticket";
import type { CreateTicketInput, UpdateTicketInput } from "@/lib/validations/ticket";
import { calculateSlaDeadline } from "../utils/sla";

const TICKET_INCLUDE = {
  assignee:   { select: { id: true, name: true, image: true } },
  creator:    { select: { id: true, name: true, image: true } },
  department: { select: { id: true, name: true, color: true } },
  requestType: {
    select: {
      id: true,
      name: true,
      fields: { select: { key: true, label: true }, orderBy: { order: "asc" as const } },
    },
  },
  comments:   {
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { comments: true } },
} as const;

const TICKET_LIST_INCLUDE = {
  assignee:   { select: { id: true, name: true, image: true } },
  creator:    { select: { id: true, name: true, image: true } },
  department: { select: { id: true, name: true, color: true } },
  _count:     { select: { comments: true } },
} as const;

export const ticketService = {

  async getAll(filters?: {
    status?:       string;
    priority?:     string;
    search?:       string;
    departmentId?: string;
    assigneeId?:   string | null;
    creatorId?:    string;
    visibilityWhere?: any;
  }) {
    const where: any = {};
    const and: any[] = [];

    if (filters?.status)       where.status       = filters.status;
    if (filters?.priority)     where.priority     = filters.priority;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.creatorId)    where.creatorId    = filters.creatorId;

    if (filters?.assigneeId !== undefined) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters?.search) {
      and.push({ OR: [
        { title:        { contains: filters.search, mode: "insensitive" } },
        { ticketNumber: { contains: filters.search, mode: "insensitive" } },
      ] });
    }

    if (filters?.visibilityWhere) {
      and.push(filters.visibilityWhere);
    }

    if (and.length > 0) {
      where.AND = and;
    }

    return prisma.ticket.findMany({
      where,
      include: TICKET_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        ...TICKET_INCLUDE,
        comments: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async create(data: any, creatorId: string) {
    const ticketCount  = await prisma.ticket.count();
    const ticketNumber = `TK-${String(ticketCount + 1).padStart(3, "0")}`;
    const slaDeadline  = calculateSlaDeadline(data.priority ?? "MEDIUM");

    return prisma.ticket.create({
      data: {
        ticketNumber,
        title:        data.title,
        description:  data.description  ?? null,
        priority:     data.priority     ?? "MEDIUM",
        status:       "OPEN",
        tags:         data.tags         ?? [],
        assigneeId:   data.assigneeId   ?? null,
        departmentId: data.departmentId ?? null,
        requestTypeId: data.requestTypeId ?? null,
        customFields:  data.customFields  ?? undefined,
        slaDeadline,
        creatorId,
      },
      include: TICKET_INCLUDE,
    });
  },

  async update(id: string, data: UpdateTicketInput) {
    return prisma.ticket.update({
      where: { id },
      data,
      include: TICKET_INCLUDE,
    });
  },

  async delete(id: string) {
    return prisma.ticket.delete({ where: { id } });
  },

  async addComment(ticketId: string, body: string, authorId: string) {
    return prisma.comment.create({
      data: { ticketId, body, authorId },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
  },

  async getStats() {
    const [open, inProgress, resolved, critical] = await Promise.all([
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { priority: "CRITICAL" } }),
    ]);
    return { open, inProgress, resolved, critical };
  },
};
