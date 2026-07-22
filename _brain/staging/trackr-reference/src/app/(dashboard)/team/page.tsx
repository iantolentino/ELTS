"use client";

import { useState } from "react";
import useSWR from "swr";
import { getInitials } from "@/utils/ticket";
import { useAbac } from "@/hooks/useAbac";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiDeleteBinLine, RiUserAddLine } from "react-icons/ri";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MdBlock } from "react-icons/md";


// ─── Types ────────────────────────────────────────────────────────────────────
type StatusAction  = "approve" | "reject" | "suspend" | "reactivate";
type ActionType    = StatusAction | "delete";
type ConfirmAction = { userId: string; name: string; action: ActionType };
type Tab           = "members" | "pending" | "rejected" | "departments";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN:   "var(--color-critical)",
  MANAGER: "var(--color-high)",
  MEMBER:  "var(--color-progress)",
};

const STATUS_MAP: Record<StatusAction, string> = {
  approve: "ACTIVE", reject: "REJECTED", suspend: "REJECTED", reactivate: "ACTIVE",
};

const CONFIRM_CONFIG: Record<ActionType, { title: string; message: (name: string) => string; confirmLabel: string; variant: "info" | "danger" | "warning" }> = {
  approve:    { title: "Approve User",    message: (n) => `Are you sure you want to approve "${n}"? They will gain full access to the system.`,                             confirmLabel: "Approve",    variant: "info"    },
  reject:     { title: "Reject User",     message: (n) => `Are you sure you want to reject "${n}"? They will not be able to access the system. This can be undone later.`,  confirmLabel: "Reject",     variant: "danger"  },
  suspend:    { title: "Suspend User",    message: (n) => `Are you sure you want to suspend "${n}"? They will lose access immediately. You can reactivate them later.`,      confirmLabel: "Suspend",    variant: "warning" },
  reactivate: { title: "Reactivate User", message: (n) => `Are you sure you want to reactivate "${n}"? They will regain full access to the system.`,                        confirmLabel: "Reactivate", variant: "info"    },
  delete:     { title: "Delete User",     message: (n) => `Delete "${n}" permanently? Users with ticket history cannot be deleted and should be suspended instead.`,         confirmLabel: "Delete",     variant: "danger"  },
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to load data");
  return data.data ?? [];
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
function SkeletonMemberCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: "80%" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 999 }} />
            </div>
            <div className="skeleton" style={{ height: 32, width: "100%", borderRadius: 6 }} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkeletonListRows({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, width: "30%", marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 10, width: "45%" }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 32, width: 72, borderRadius: 6 }} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkeletonDeptCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 13, width: "50%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: "70%" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="skeleton" style={{ flex: 1, height: 52, borderRadius: 6 }} />
              <div className="skeleton" style={{ flex: 1, height: 52, borderRadius: 6 }} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkeletonTabs({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 32, width: i === 0 ? 120 : 100, borderRadius: 6 }} />
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <Card>
      <CardContent style={{ padding: "48px 20px", textAlign: "center" }}>
        <div style={{ color: "var(--muted-foreground)", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{title}</div>
        <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{sub}</div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [confirm,   setConfirm]   = useState<ConfirmAction | null>(null);
  const [actioning, setActioning] = useState(false);
  const [error,     setError]     = useState("");

  const { canManageTeam, canAssignRole, user } = useAbac();

  const { data: users = [], mutate: mutateUsers, isLoading: usersLoading, error: usersError } = useSWR("/api/users", fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 });
  const { data: departments = [], isLoading: deptLoading, error: departmentsError } = useSWR("/api/departments?includeCounts=true", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });

  const staffRoles    = ["ADMIN", "MANAGER", "MEMBER"];
  const activeUsers   = users.filter((u: any) => u.status === "ACTIVE" && staffRoles.includes(u.role));
  const pendingUsers  = users.filter((u: any) => u.status === "PENDING"  && (user.role === "ADMIN" || u.departmentId === user.departmentId));
  const rejectedUsers = users.filter((u: any) => u.status === "REJECTED" && (user.role === "ADMIN" || u.departmentId === user.departmentId));
  const loadError     = usersError?.message ?? departmentsError?.message ?? "";

  const updateStatus = async (userId: string, status: string) => {
    setActioning(true);
    try {
      setError("");
      const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update user");
        return;
      }
      await mutateUsers();
    } finally { setActioning(false); setConfirm(null); }
  };

  const updateRole = async (userId: string, role: string) => {
    setError("");
    const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update role");
      return;
    }
    await mutateUsers();
  };

  const updateDepartment = async (userId: string, departmentId: string) => {
    setError("");
    const res = await fetch(`/api/users/${userId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ departmentId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update department");
      return;
    }
    await mutateUsers();
  };

  const deleteUser = async (userId: string) => {
    setActioning(true);
    try {
      setError("");
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete user");
        return;
      }
      await mutateUsers();
    } finally { setActioning(false); setConfirm(null); }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.action === "delete") {
      await deleteUser(confirm.userId);
      return;
    }
    await updateStatus(confirm.userId, STATUS_MAP[confirm.action]);
  };

  const tabs = [
    { id: "members",     label: "Members",     count: activeUsers.length,   show: true            },
    { id: "pending",     label: "Pending",     count: pendingUsers.length,   show: canManageTeam() },
    { id: "rejected",    label: "Rejected",    count: rejectedUsers.length,  show: canManageTeam() },
    { id: "departments", label: "Departments", count: null,                  show: true            },
  ].filter((t) => t.show);

  const initialLoading = usersLoading && deptLoading;
  const canDeleteUser = (u: any) => canAssignRole() && u.id !== user.id;
  const isDepartmentRole = (role: string) => ["MANAGER", "MEMBER"].includes(role);

  const departmentSelect = (u: any) => canAssignRole() ? (
    isDepartmentRole(u.role) ? (
    <Select value={u.departmentId ?? ""} onValueChange={(val: string) => updateDepartment(u.id, val)}>
      <SelectTrigger style={{ fontSize: 11, height: 32, fontFamily: "inherit", marginBottom: 6 }}>
        <SelectValue placeholder="Assign department" />
      </SelectTrigger>
      <SelectContent>
        {departments.map((dept: any) => (
          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    ) : (
      <div style={{ height: 32, display: "flex", alignItems: "center", color: "var(--muted-foreground)", fontSize: 11, marginBottom: 6 }}>
        {u.role === "REQUESTER" ? "Portal requester" : "No department required"}
      </div>
    )
  ) : null;

  const roleSelect = (u: any) => canAssignRole() ? (
    <Select value={u.role} onValueChange={(val: string) => updateRole(u.id, val)}>
      <SelectTrigger style={{ fontSize: 11, height: 32, fontFamily: "inherit", marginBottom: canManageTeam() ? 6 : 0 }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="MANAGER">Manager</SelectItem>
        <SelectItem value="MEMBER">Member</SelectItem>
        <SelectItem value="REQUESTER">Requester</SelectItem>
      </SelectContent>
    </Select>
  ) : null;

  // ── Skeleton ───────────────────────────────────────────────────────
  if (initialLoading) return (
    <>
      <PageHeader title="Team" subtitle="Manage your team members and departments" />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)" }}>
        <SkeletonTabs count={4} />
        <SkeletonMemberCards />
      </div>
    </>
  );

  // ── Full render ────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Manage your team members and departments"
        actions={
          !initialLoading && pendingUsers.length > 0 && canManageTeam() ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("pending")}
              style={{ gap: 6, fontSize: 12, color: "var(--color-high)", borderColor: "var(--color-high)", fontFamily: "inherit" }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-high)", display: "inline-block" }} />
              {pendingUsers.length} pending approval{pendingUsers.length > 1 ? "s" : ""}
            </Button>
          ) : undefined
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)", }}>
        {(error || loadError) && (
          <div style={{ marginBottom: 12, border: "1px solid var(--color-danger)", color: "var(--color-danger)", borderRadius: 6, padding: "10px 12px", fontSize: 12, background: "color-mix(in srgb, var(--color-danger) 8%, transparent)" }}>
            {error || loadError}
          </div>
        )}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>

          {/* ── Tab triggers ── */}
          <TabsList className="mb-4" style={{width: "fit-content"}}>

            <TabsTrigger value="members" style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 14px", height: 32, gap: 8 }}>
              Members
              {activeUsers.length > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, borderRadius: "50%", background: "#3f3f46", color: "#a1a1aa", fontSize: 10, fontWeight: 600, padding: "0 4px" }}>
                  {activeUsers.length}
                </span>
              )}
            </TabsTrigger>

            {canManageTeam() && (
              <TabsTrigger value="pending" style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 14px", height: 32, gap: 8, position: "relative" }}>
                Pending
                {pendingUsers.length > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, borderRadius: "50%", background: "#3f3f46", color: "#a1a1aa", fontSize: 10, fontWeight: 600, padding: "0 4px" }}>
                    {pendingUsers.length}
                  </span>
                )}
                {pendingUsers.length > 0 && activeTab !== "pending" && (
                  <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "var(--color-high)" }} />
                )}
              </TabsTrigger>
            )}

            {canManageTeam() && (
              <TabsTrigger value="rejected" style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 14px", height: 32, gap: 8 }}>
                Rejected
                {rejectedUsers.length > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, borderRadius: "50%", background: "#3f3f46", color: "#a1a1aa", fontSize: 10, fontWeight: 600, padding: "0 4px" }}>
                    {rejectedUsers.length}
                  </span>
                )}
              </TabsTrigger>
            )}

            <TabsTrigger value="departments" style={{ fontSize: 13, fontFamily: "inherit", padding: "6px 14px", height: 32 }}>
              Departments
            </TabsTrigger>

          </TabsList>

          {/* ── Members ── */}
          <TabsContent value="members">
            {activeUsers.length === 0 ? (
              <EmptyState title="No active members" sub="Approved admins, managers, and members will appear here" />
            ) : (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--card)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                        {["Member", "Role", "Department", "Joined", "Actions"].map((header) => (
                          <th key={header} style={{ textAlign: header === "Actions" ? "right" : "left", padding: "10px 14px", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0 }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeUsers.map((u: any) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px 14px", width: "34%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <Avatar style={{ width: 34, height: 34, flexShrink: 0 }}>
                                <AvatarFallback style={{ fontSize: 12, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                                  {getInitials(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: "var(--foreground)", fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                                <div style={{ color: "var(--muted-foreground)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", width: 160 }}>
                            {canAssignRole() ? roleSelect(u) : (
                              <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: ROLE_COLORS[u.role], gap: 4 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: ROLE_COLORS[u.role], display: "inline-block" }} />
                                {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                              </Badge>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", width: 220 }}>
                            {canAssignRole() ? departmentSelect(u) : (
                              u.department ? (
                                <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: "var(--muted-foreground)" }}>
                                  {u.department.name}
                                </Badge>
                              ) : (
                                <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>No department</span>
                              )
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", color: "var(--muted-foreground)", fontSize: 12, whiteSpace: "nowrap" }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            {canManageTeam() && (
                              <div style={{ display: "inline-flex", justifyContent: "flex-end", gap: 6 }}>
                                <Button variant="outline" size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "suspend" })} style={{ fontSize: 11, color: "var(--color-high)", borderColor: "var(--border)", fontFamily: "inherit" }}>
                                  <MdBlock size={18} />
                                </Button>
                                {canDeleteUser(u) && (
                                  <Button variant="outline" size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "delete" })} disabled={actioning} title="Delete user" style={{ width: 32, padding: 0, color: "var(--color-danger)", borderColor: "var(--border)" }}>
                                    <RiDeleteBinLine size={18} />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Pending ── */}
          <TabsContent value="pending">
            {pendingUsers.length === 0 ? (
              <EmptyState title="All caught up!" sub="No pending approvals at this time" />
            ) : (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--card)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                        {["User", "Requested role", "Department", "Created", "Actions"].map((header) => (
                          <th key={header} style={{ textAlign: header === "Actions" ? "right" : "left", padding: "10px 14px", color: "var(--muted-foreground)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0 }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u: any) => {
                        const isStaffRole = isDepartmentRole(u.role);
                        const needsDepartment = isStaffRole && !u.departmentId;
                        const approveLabel = isStaffRole ? "Approve staff" : "Approve";

                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "12px 14px", width: "32%" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                <Avatar style={{ width: 34, height: 34, flexShrink: 0 }}>
                                  <AvatarFallback style={{ fontSize: 12, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                                    {getInitials(u.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ color: "var(--foreground)", fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                                  <div style={{ color: "var(--muted-foreground)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", width: 170 }}>
                              {roleSelect(u) ?? (
                                <Badge variant="outline" style={{ fontSize: 10, fontWeight: 500, color: ROLE_COLORS[u.role] ?? "var(--muted-foreground)", gap: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: ROLE_COLORS[u.role] ?? "var(--muted-foreground)", display: "inline-block" }} />
                                  {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                                </Badge>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", width: 230 }}>
                              {departmentSelect(u)}
                              {needsDepartment && (
                                <div style={{ color: "var(--color-high)", fontSize: 11, marginTop: -2 }}>
                                  Required before approval
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", color: "var(--muted-foreground)", fontSize: 12, whiteSpace: "nowrap" }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", justifyContent: "flex-end", gap: 6 }}>
                                <Button size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "approve" })} disabled={actioning || needsDepartment} style={{ fontSize: 11, fontFamily: "inherit" }}>
                                  <RiUserAddLine size={12} /> {approveLabel}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "reject" })} disabled={actioning} style={{ fontSize: 11, color: "var(--color-danger)", borderColor: "var(--border)", fontFamily: "inherit" }}>
                                  Reject
                                </Button>
                                {canDeleteUser(u) && (
                                  <Button variant="outline" size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "delete" })} disabled={actioning} title="Delete user" style={{ width: 32, padding: 0, color: "var(--color-danger)", borderColor: "var(--border)" }}>
                                    <RiDeleteBinLine size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Rejected ── */}
          <TabsContent value="rejected">
            {rejectedUsers.length === 0 ? (
              <EmptyState title="No rejected users" sub="All rejections will appear here" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rejectedUsers.map((u: any) => (
                  <Card key={u.id}>
                    <CardContent style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                      <Avatar style={{ width: 40, height: 40, flexShrink: 0, opacity: 0.5 }}>
                        <AvatarFallback style={{ fontSize: 13, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "var(--muted-foreground)", fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                        <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{u.email}</div>
                        {u.department && <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginTop: 2 }}>{u.department.name}</div>}
                      </div>
                      <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginRight: 4 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ width: 180 }}>
                        {departmentSelect(u)}
                      </div>
                      <div style={{ width: 150 }}>
                        {roleSelect(u)}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button variant="outline" size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "reactivate" })} disabled={actioning} style={{ fontSize: 11, fontFamily: "inherit" }}>
                          Reactivate
                        </Button>
                        {canDeleteUser(u) && (
                          <Button variant="outline" size="sm" onClick={() => setConfirm({ userId: u.id, name: u.name, action: "delete" })} disabled={actioning} title="Delete user" style={{ width: 32, padding: 0, color: "var(--color-danger)", borderColor: "var(--border)" }}>
                            <RiDeleteBinLine size={14} />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Departments ── */}
          <TabsContent value="departments">
            {deptLoading ? <SkeletonDeptCards /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {departments.map((dept: any) => (
                  <Card key={dept.id} style={{ overflow: "hidden" }}>
                    <div style={{ height: 3, background: dept.color }} />
                    <CardContent style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⬡</div>
                        <div>
                          <div style={{ color: "var(--foreground)", fontWeight: 600, fontSize: 13 }}>{dept.name}</div>
                          <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{dept.description}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[{ label: "Members", count: dept._count.users }, { label: "Tickets", count: dept._count.tickets }].map(({ label, count }) => (
                          <div key={label} style={{ background: "var(--muted)", borderRadius: 6, padding: "8px 12px", flex: 1, textAlign: "center" }}>
                            <div style={{ color: "var(--foreground)", fontWeight: 600, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{count}</div>
                            <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginTop: 2 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {confirm && (
        <ConfirmModal
          title={CONFIRM_CONFIG[confirm.action].title}
          message={CONFIRM_CONFIG[confirm.action].message(confirm.name)}
          confirmLabel={CONFIRM_CONFIG[confirm.action].confirmLabel}
          variant={CONFIRM_CONFIG[confirm.action].variant}
          loading={actioning}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
