import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyRequestsClient from "./MyRequestClient";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?redirect=/portal/my-requests");

  const userId = session.user.id as string;

  const tickets = await prisma.ticket.findMany({
    where:   { creatorId: userId },
    select: {
      id:           true,
      ticketNumber: true,
      title:        true,
      status:       true,
      priority:     true,
      createdAt:    true,
      department:   { select: { id: true, name: true, color: true } },
      assignee:     { select: { id: true, name: true } },
      _count:       { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <MyRequestsClient tickets={tickets} user={session.user} />;
}
