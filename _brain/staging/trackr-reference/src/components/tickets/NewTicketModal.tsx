"use client";

import { useState, useEffect } from "react";
import { useAbac } from "@/hooks/useAbac";
import { SLA_HOURS } from "@/utils/sla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiAlertLine, RiTimeLine } from "react-icons/ri";

interface NewTicketModalProps {
  onClose: () => void;
  onAdd:   (data: any) => Promise<void>;
}

const SLA_PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH:     "var(--color-high)",
  MEDIUM:   "var(--color-medium)",
  LOW:      "var(--color-low)",
};

export default function NewTicketModal({ onClose, onAdd }: NewTicketModalProps) {
  const [users,       setUsers]       = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const { user } = useAbac();

  const isAdmin = user.role === "ADMIN";
  const isScopedStaff = ["MANAGER", "MEMBER"].includes(user.role);

  const [form, setForm] = useState({
    title:        "",
    description:  "",
    priority:     "MEDIUM",
    tags:         "",
    assigneeId:   "",
    departmentId: "",
  });

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => {
        setDepartments(d.data ?? []);
        if (isScopedStaff && user.departmentId) {
          setForm((f) => ({ ...f, departmentId: user.departmentId ?? "" }));
        }
      });
  }, [isScopedStaff, user.departmentId]);

  useEffect(() => {
    if (!form.departmentId) {
      setUsers([]);
      return;
    }

    fetch(`/api/users?departmentId=${form.departmentId}&status=ACTIVE`)
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []));
  }, [form.departmentId]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim())             { setError("Title is required");              return; }
    if (!form.departmentId) { setError("Please select a department"); return; }
    setSubmitting(true);
    setError("");
    try {
      await onAdd({
        title:        form.title,
        description:  form.description || undefined,
        priority:     form.priority,
        tags:         form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        assigneeId:   form.assigneeId || undefined,
        departmentId: form.departmentId,
      });
      onClose();
    } catch {
      setError("Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const slaHours = SLA_HOURS[form.priority];
  const slaLabel = slaHours < 24
    ? `${slaHours} hour${slaHours > 1 ? "s" : ""}`
    : `${slaHours / 24} day${slaHours / 24 > 1 ? "s" : ""}`;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        style={{ maxWidth: 520, fontFamily: "inherit", maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: 16, fontWeight: 600, fontFamily: "inherit" }}>
            New Ticket
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>

          {/* Error */}
          {error && (
            <div style={{
              display:      "flex",
              alignItems:   "flex-start",
              gap:          8,
              background:   "rgba(248,113,113,0.06)",
              border:       "1px solid rgba(248,113,113,0.2)",
              borderRadius: 6,
              padding:      "10px 12px",
            }}>
              <RiAlertLine size={14} style={{ color: "var(--color-critical)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: "var(--color-critical)", fontSize: 12, lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
              Title <span style={{ color: "var(--color-critical)" }}>*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Brief description of the issue…"
              style={{ fontSize: 13, fontFamily: "inherit" }}
            />
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
              Description
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Provide more details about the issue…"
              style={{ fontSize: 13, fontFamily: "inherit", minHeight: 80, resize: "vertical" }}
            />
          </div>

          {/* Department */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
              Department <span style={{ color: "var(--color-critical)" }}>*</span>
            </Label>
            <Select
              value={form.departmentId || ""}
              onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v, assigneeId: "" }))}
              disabled={isScopedStaff}
            >
              <SelectTrigger style={{ fontSize: 13, fontFamily: "inherit" }}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.filter((d) => isAdmin || d.id === user.departmentId).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              Use the portal to request help from another department.
            </p>
          </div>

          {/* Priority */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
              Priority
            </Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger style={{ fontSize: 13, fontFamily: "inherit" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted-foreground)" }}>
              <RiTimeLine size={12} />
              SLA deadline:{" "}
              <span style={{ color: SLA_PRIORITY_COLOR[form.priority], fontWeight: 500 }}>
                {slaLabel}
              </span>{" "}
              from creation
            </div>
          </div>

          {/* Assignee */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
                Assignee
              </Label>
              <Select value={form.assigneeId || "unassigned"} onValueChange={(v) => set("assigneeId", v === "unassigned" ? "" : v)} disabled={!form.departmentId}>
                <SelectTrigger style={{ fontSize: 13, fontFamily: "inherit" }}>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.filter((u) => u.status === "ACTIVE" && ["ADMIN", "MANAGER", "MEMBER"].includes(u.role)).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} - {u.department?.name ?? "No dept"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
              Tags
            </Label>
            <Input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="bug, frontend, urgent (comma separated)"
              style={{ fontSize: 13, fontFamily: "inherit" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Button
              variant="outline"
              onClick={onClose}
              style={{ fontSize: 13, fontFamily: "inherit" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}
            >
              {submitting ? "Creating..." : "Create Ticket"}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
