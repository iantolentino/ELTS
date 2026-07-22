// src/lib/abac.ts

export type Role = "ADMIN" | "MANAGER" | "MEMBER" | "REQUESTER";

export interface AbacUser {
  id:           string;
  role:         Role;
  departmentId?: string | null;
}

export interface TicketAttrs {
  creatorId:    string;
  assigneeId:   string | null;
  departmentId: string | null;
  status:       string;
}

export const abac = {
  canViewTicket: (actor: AbacUser, ticket: TicketAttrs) => {
    if (actor.role === "ADMIN") return true;
    if (actor.role === "MANAGER") return !!actor.departmentId && actor.departmentId === ticket.departmentId;
    if (actor.role === "MEMBER") {
      return ticket.assigneeId === actor.id ||
        (!ticket.assigneeId && !!actor.departmentId && actor.departmentId === ticket.departmentId);
    }
    if (actor.role === "REQUESTER") return ticket.creatorId === actor.id;
    return false;
  },
  ticketVisibilityWhere: (actor: AbacUser) => {
    if (actor.role === "ADMIN") return {};
    if (actor.role === "MANAGER") {
      return actor.departmentId ? { departmentId: actor.departmentId } : { id: "__none__" };
    }
    if (actor.role === "MEMBER") {
      return {
        OR: [
          { assigneeId: actor.id },
          { assigneeId: null, departmentId: actor.departmentId ?? "__none__" },
        ],
      };
    }
    if (actor.role === "REQUESTER") return { creatorId: actor.id };
    return { id: "__none__" };
  },
  canCreateTicket: (actor: AbacUser)  => ["ADMIN", "MANAGER", "MEMBER", "REQUESTER"].includes(actor.role),
  canEditTicket:   (actor: AbacUser, ticket: TicketAttrs) =>
    actor.role === "ADMIN" ||
    actor.role === "MANAGER" ||
    (actor.role !== "REQUESTER" && ticket.creatorId === actor.id),
  canChangeStatus: (actor: AbacUser, ticket: TicketAttrs) => {
    if (actor.role === "REQUESTER") return false;
    if (actor.role === "ADMIN" || actor.role === "MANAGER") return true;
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      return ticket.assigneeId === actor.id;
    }
    return ticket.creatorId === actor.id || ticket.assigneeId === actor.id;
  },
  canSelfAssign: (actor: AbacUser, ticket: TicketAttrs) => {
    if (actor.role === "REQUESTER") return false;
    if (actor.role === "ADMIN" && !ticket.assigneeId) return true;
    if (["MANAGER", "MEMBER"].includes(actor.role) && !ticket.assigneeId) {
      return !!actor.departmentId && actor.departmentId === ticket.departmentId;
    }
    return false;
  },
  canReassign: (actor: AbacUser, ticket: TicketAttrs) => {
    if (actor.role === "REQUESTER") return false;
    return (
      actor.role === "ADMIN" ||
      actor.role === "MANAGER" ||
      (actor.role === "MEMBER" && actor.departmentId === ticket.departmentId)
    );
  },
  canDeleteTicket:  (actor: AbacUser) => actor.role === "ADMIN",
  canAddComment:    (actor: AbacUser) => ["ADMIN", "MANAGER", "MEMBER", "REQUESTER"].includes(actor.role),
  canDeleteComment: (actor: AbacUser, commentAuthorId: string) =>
    actor.role === "ADMIN" || actor.id === commentAuthorId,

  // REQUESTER cannot see other people's tickets
  canViewAllTickets: (actor: AbacUser) => actor.role !== "REQUESTER",

  // Team management
  canManageTeam:        (actor: AbacUser) => ["ADMIN", "MANAGER"].includes(actor.role),
  canApproveUser:       (actor: AbacUser, targetDepartmentId: string | null) => {
    if (actor.role === "ADMIN")   return true;
    if (actor.role === "MANAGER") return actor.departmentId === targetDepartmentId;
    return false;
  },
  canAssignRole:        (actor: AbacUser) => actor.role === "ADMIN",
  canManageDepartments: (actor: AbacUser) => actor.role === "ADMIN",

  canEditPriority: (actor: AbacUser, ticket: TicketAttrs) =>
  actor.role === "ADMIN" ||
  actor.role === "MANAGER" ||
  (actor.role === "MEMBER" && actor.departmentId === ticket.departmentId),
};
