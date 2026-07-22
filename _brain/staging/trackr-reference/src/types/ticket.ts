// src/types/ticket.ts

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Role = "ADMIN" | "MANAGER" | "MEMBER" | "REQUESTER";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  createdAt: Date;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  author: Pick<User, "id" | "name" | "image">;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  assignee: Pick<User, "id" | "name" | "image"> | null;
  creator: Pick<User, "id" | "name" | "image">;
  comments: Comment[];
  _count?: { comments: number };
}

export interface CreateTicketInput {
  title: string;
  description?: string;
  priority: Priority;
  tags: string[];
  assigneeId?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: Priority;
  tags?: string[];
  assigneeId?: string | null;
}
