"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RiArrowLeftLine, RiAddLine, RiSearchLine,
  RiQuestionLine, RiArrowDownSLine, RiArrowUpSLine,
} from "react-icons/ri";
import PortalAccountMenu from "@/components/portal/PortalAccountMenu";

interface RequestType {
  id: string; name: string; description: string | null; icon: string; fields?: RequestTypeField[];
}
interface RequestTypeField {
  id: string; label: string; key: string; type: "TEXT" | "TEXTAREA" | "SELECT" | "NUMBER" | "DATE" | "BOOLEAN";
  required: boolean; placeholder: string | null; helpText: string | null; options: string[];
}
interface FaqItem {
  id: string; question: string; answer: string;
}

const PRIORITY_OPTIONS = [
  { value: "LOW",      label: "Low"      },
  { value: "MEDIUM",   label: "Medium"   },
  { value: "HIGH",     label: "High"     },
  { value: "CRITICAL", label: "Critical" },
];

export default function DepartmentPortalClient({ dept }: { dept: any }) {
  const router                  = useRouter();
  const { data: session, status } = useSession();
  const [search,      setSearch]      = useState("");
  const [openFaq,     setOpenFaq]     = useState<string | null>(null);
  const [selected,    setSelected]    = useState<RequestType | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");
  const [form, setForm] = useState({
    title:       "",
    description: "",
    priority:    "MEDIUM",
  });
  const [customFields, setCustomFields] = useState<Record<string, string | number | boolean>>({});

  const isLoggedIn  = status === "authenticated";
  const isInternal  = ["ADMIN", "MANAGER", "MEMBER"].includes((session?.user as any)?.role);

  const filteredTypes = ((dept.requestTypes ?? []) as RequestType[]).filter((rt: RequestType) =>
    rt.name.toLowerCase().includes(search.toLowerCase()) ||
    rt.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectType = (rt: RequestType) => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/portal/${dept.id}`);
      return;
    }
    setSelected(rt);
    setForm({ title: rt.name, description: "", priority: "MEDIUM" });
    setCustomFields({});
    setSubmitted(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    const missingField = selected?.fields?.find((field) => {
      if (!field.required) return false;
      const value = customFields[field.key];
      return value === undefined || value === "";
    });
    if (missingField) { setError(`${missingField.label} is required`); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:        form.title,
          description:  form.description || undefined,
          priority:     form.priority,
          departmentId: dept.id,
          requestTypeId: selected?.id,
          customFields,
          tags:         [selected?.name ?? ""],
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateCustomField = (key: string, value: string | number | boolean) => {
    setCustomFields((fields) => ({ ...fields, [key]: value }));
  };

  const renderCustomField = (field: RequestTypeField) => {
    const value = customFields[field.key];
    const label = (
      <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
        {field.label} {field.required && <span style={{ color: "var(--color-critical)" }}>*</span>}
      </Label>
    );

    const help = field.helpText ? (
      <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{field.helpText}</div>
    ) : null;

    if (field.type === "TEXTAREA") {
      return (
        <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {label}
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => updateCustomField(field.key, e.target.value)}
            placeholder={field.placeholder ?? undefined}
            style={{ fontSize: 13, fontFamily: "inherit", minHeight: 84, resize: "vertical" }}
          />
          {help}
        </div>
      );
    }

    if (field.type === "SELECT") {
      return (
        <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {label}
          <Select value={String(value ?? "")} onValueChange={(v) => updateCustomField(field.key, v)}>
            <SelectTrigger style={{ fontSize: 13, fontFamily: "inherit" }}>
              <SelectValue placeholder={field.placeholder ?? "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {help}
        </div>
      );
    }

    if (field.type === "BOOLEAN") {
      return (
        <label key={field.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "var(--foreground)", fontSize: 13, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateCustomField(field.key, e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            {field.label} {field.required && <span style={{ color: "var(--color-critical)" }}>*</span>}
            {help}
          </span>
        </label>
      );
    }

    return (
      <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label}
        <Input
          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
          value={String(value ?? "")}
          onChange={(e) => updateCustomField(field.key, field.type === "NUMBER" ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder ?? undefined}
          style={{ fontSize: 13, fontFamily: "inherit" }}
        />
        {help}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom:   "1px solid var(--border)",
        background:     "var(--background)",
        padding:        "0 24px",
        height:         56,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        position:       "sticky",
        top:            0,
        zIndex:         50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "var(--foreground)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="var(--background)" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="var(--background)" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="var(--background)" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="var(--background)" opacity="0.4" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            Trackr
          </span>
          <Badge variant="outline" style={{ fontSize: 10, marginLeft: 4 }}>Portal</Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isLoggedIn && (
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/portal/my-requests")}
                style={{ fontSize: 13, fontFamily: "inherit" }}
              >
                My Requests
              </Button>
              {isInternal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/tickets")}
                  style={{ fontSize: 13, fontFamily: "inherit" }}
                >
                  Agent Dashboard
                </Button>
              )}
              {session?.user && <PortalAccountMenu user={session.user as any} />}
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ── Breadcrumb ── */}
        <Button
          variant="ghost" size="sm"
          onClick={() => router.push("/portal")}
          style={{ fontSize: 12, color: "var(--muted-foreground)", gap: 4, fontFamily: "inherit", paddingLeft: 0, marginBottom: 20 }}
        >
          <RiArrowLeftLine size={13} /> All Departments
        </Button>

        {/* ── Department hero ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{
              width:          52,
              height:         52,
              borderRadius:   12,
              background:     dept.color + "18",
              border:         `1px solid ${dept.color}30`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       22,
              flexShrink:     0,
            }}>
              ⬡
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {dept.name}
              </h1>
              <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.5 }}>
                {dept.description ?? "Browse request types below and submit a support request."}
              </p>
            </div>
          </div>
        </div>

        {/* ── Request Types ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
              Request Types
            </h2>
            {/* Search */}
            <div style={{ position: "relative", width: 220 }}>
              <RiSearchLine size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{ paddingLeft: 30, fontSize: 12, height: 32, fontFamily: "inherit" }}
              />
            </div>
          </div>

          {filteredTypes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted-foreground)", fontSize: 13 }}>
              No request types found
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
              {filteredTypes.map((rt) => (
                <Card
                  key={rt.id}
                  style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
                  onClick={() => handleSelectType(rt)}
                >
                  <CardContent style={{ padding: "18px 20px" }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{rt.icon}</div>
                    <div style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      {rt.name}
                    </div>
                    <div style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.5 }}>
                      {rt.description ?? "Submit a request"}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, color: dept.color, fontSize: 12, fontWeight: 500 }}>
                      <RiAddLine size={13} />
                      {!isLoggedIn ? "Sign in to submit" : "Submit request"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── FAQ ── */}
        {dept.faqItems.length > 0 && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <RiQuestionLine size={15} style={{ color: "var(--muted-foreground)" }} />
              Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(dept.faqItems as FaqItem[]).map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    border:       "1px solid var(--border)",
                    borderRadius: 8,
                    overflow:     "hidden",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    style={{
                      width:          "100%",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "space-between",
                      padding:        "14px 16px",
                      background:     "transparent",
                      border:         "none",
                      cursor:         "pointer",
                      textAlign:      "left",
                      gap:            12,
                    }}
                  >
                    <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                      {faq.question}
                    </span>
                    {openFaq === faq.id
                      ? <RiArrowUpSLine size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                      : <RiArrowDownSLine size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                    }
                  </button>
                  {openFaq === faq.id && (
                    <div style={{
                      padding:    "0 16px 14px",
                      color:      "var(--muted-foreground)",
                      fontSize:   13,
                      lineHeight: 1.6,
                      borderTop:  "1px solid var(--border)",
                      paddingTop: 12,
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop:      "1px solid var(--border)",
        padding:        "20px 24px",
        textAlign:      "center",
        color:          "var(--muted-foreground)",
        fontSize:       12,
      }}>
        © 2026 Powered by{" "}
        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>Trackr</span>
        . All rights reserved.
      </div>

      {/* ── Submit Request Modal ── */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent style={{ maxWidth: 480, fontFamily: "inherit" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
                Request Submitted!
              </h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginBottom: 24 }}>
                Your request has been submitted to <strong>{dept.name}</strong>. We'll get back to you soon.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Button variant="outline" onClick={() => setSelected(null)} style={{ fontSize: 13, fontFamily: "inherit" }}>
                  Submit Another
                </Button>
                <Button onClick={() => router.push("/portal/my-requests")} style={{ fontSize: 13, fontFamily: "inherit" }}>
                  View My Requests
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 24 }}>{selected?.icon}</span>
                  <DialogTitle style={{ fontSize: 16, fontWeight: 600, fontFamily: "inherit" }}>
                    {selected?.name}
                  </DialogTitle>
                </div>
                {selected?.description && (
                  <DialogDescription style={{ fontSize: 12, fontFamily: "inherit" }}>
                    {selected.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
                {error && (
                  <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, padding: "10px 12px", color: "var(--color-critical)", fontSize: 12 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
                    Summary <span style={{ color: "var(--color-critical)" }}>*</span>
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Brief description of your request…"
                    style={{ fontSize: 13, fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
                    Details
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Provide as much detail as possible…"
                    style={{ fontSize: 13, fontFamily: "inherit", minHeight: 100, resize: "vertical" }}
                  />
                </div>

                {(selected?.fields?.length ?? 0) > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {selected?.fields?.map(renderCustomField)}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
                    Priority
                  </Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger style={{ fontSize: 13, fontFamily: "inherit" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <Button variant="outline" onClick={() => setSelected(null)} style={{ fontSize: 13, fontFamily: "inherit" }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} style={{ fontSize: 13, fontFamily: "inherit" }}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
