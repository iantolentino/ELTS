"use client";

import { useSession } from "next-auth/react";
import { abac, AbacUser, TicketAttrs } from "@/lib/abac";

export function useAbac() {
  const { data: session } = useSession();

  const user: AbacUser = {
    id:           (session?.user as any)?.id           ?? "",
    role:         (session?.user as any)?.role         ?? "REQUESTER",
    departmentId: (session?.user as any)?.departmentId ?? null,
  };

  return {
    user,
    canViewTicket:        (ticket: TicketAttrs)               => abac.canViewTicket(user, ticket),
    canCreateTicket:      ()                                  => abac.canCreateTicket(user),
    canEditTicket:        (ticket: TicketAttrs)               => abac.canEditTicket(user, ticket),
    canSelfAssign:        (ticket: TicketAttrs)               => abac.canSelfAssign(user, ticket),
    canReassign:          (ticket: TicketAttrs)               => abac.canReassign(user, ticket),
    canChangeStatus:      (ticket: TicketAttrs)               => abac.canChangeStatus(user, ticket),
    canDeleteTicket:      ()                                  => abac.canDeleteTicket(user),
    canAddComment:        ()                                  => abac.canAddComment(user),
    canDeleteComment:     (commentAuthorId: string)           => abac.canDeleteComment(user, commentAuthorId),
    canViewAllTickets:    ()                                  => abac.canViewAllTickets(user),
    canManageTeam:        ()                                  => abac.canManageTeam(user),
    canApproveUser:       (targetDepartmentId: string | null) => abac.canApproveUser(user, targetDepartmentId),
    canAssignRole:        ()                                  => abac.canAssignRole(user),
    canManageDepartments: ()                                  => abac.canManageDepartments(user),
    canEditPriority:      (ticket: TicketAttrs)               => abac.canEditPriority(user, ticket),
  };
}
