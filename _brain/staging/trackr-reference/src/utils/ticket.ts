// src/utils/ticket.ts

import { prisma } from "@/lib/prisma";

/** Generates the next sequential ticket number e.g. TK-042 */
export async function generateTicketNumber(): Promise<string> {
  const count = await prisma.ticket.count();
  const next = count + 1;
  return `TK-${String(next).padStart(3, "0")}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
