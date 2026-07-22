"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiArrowRightLine, RiSearchLine } from "react-icons/ri";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import PortalAccountMenu from "@/components/portal/PortalAccountMenu";

interface Department {
  id:          string;
  name:        string;
  description: string | null;
  color:       string;
}

export default function PortalClient({ departments }: { departments: Department[] }) {
  const router  = useRouter();
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  

  const isLoggedIn = !!session;
  const isInternal = ["ADMIN", "MANAGER", "MEMBER"].includes((session?.user as any)?.role);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        background:   "var(--background)",
        padding:      "0 24px",
        height:       56,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        position:     "sticky",
        top:          0,
        zIndex:       50,
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
          {isLoggedIn ? (
            <>
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
            <PortalAccountMenu user={session.user as any} />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/auth/login")}
                style={{ fontSize: 13, fontFamily: "inherit" }}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/auth/register")}
                style={{ fontSize: 13, fontFamily: "inherit" }}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        padding:    "64px 24px 48px",
        textAlign:  "center",
        maxWidth:   640,
        margin:     "0 auto",
      }}>
        <h1 style={{
          fontSize:      32,
          fontWeight:    700,
          color:         "var(--foreground)",
          letterSpacing: "-0.03em",
          lineHeight:    1.2,
          marginBottom:  12,
        }}>
          How can we help you?
        </h1>
        <p style={{
          color:        "var(--muted-foreground)",
          fontSize:     15,
          lineHeight:   1.6,
          marginBottom: 32,
        }}>
          Browse our departments and submit a support request. We'll get back to you as soon as possible.
        </p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}>
          <RiSearchLine
            size={15}
            style={{
              position:  "absolute",
              left:      12,
              top:       "50%",
              transform: "translateY(-50%)",
              color:     "var(--muted-foreground)",
              pointerEvents: "none",
            }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            style={{ paddingLeft: 36, fontSize: 14, height: 42, fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* ── Department grid ── */}
      <div style={{
        maxWidth: 1100,
        margin:   "0 auto",
        padding:  "0 24px 64px",
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted-foreground)", fontSize: 14 }}>
            No departments found matching "{search}"
          </div>
        ) : (
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap:                 16,
          }}>
            {filtered.map((dept) => (
              <Card
                key={dept.id}
                style={{ cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
                onClick={() => router.push(`/portal/${dept.id}`)}
              >
                {/* Color bar */}
                <div style={{ height: 3, background: dept.color }} />
                <CardContent style={{ padding: "20px 24px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{
                      width:          40,
                      height:         40,
                      borderRadius:   8,
                      background:     dept.color + "18",
                      border:         `1px solid ${dept.color}30`,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      fontSize:       18,
                      flexShrink:     0,
                    }}>
                      ⬡
                    </div>
                    <RiArrowRightLine size={16} style={{ color: "var(--muted-foreground)", marginTop: 4 }} />
                  </div>

                  <h3 style={{
                    color:        "var(--foreground)",
                    fontSize:     15,
                    fontWeight:   600,
                    marginBottom: 6,
                    letterSpacing: "-0.01em",
                  }}>
                    {dept.name}
                  </h3>

                  <p style={{
                    color:        "var(--muted-foreground)",
                    fontSize:     13,
                    lineHeight:   1.5,
                    marginBottom: 16,
                    minHeight:    40,
                  }}>
                    {dept.description ?? "Submit a request to this department."}
                  </p>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop:   "1px solid var(--border)",
        padding:     "20px 24px",
        textAlign:   "center",
        color:       "var(--muted-foreground)",
        fontSize:    12,
      }}>
        © 2026 Powered by{" "}
        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>Trackr</span>
        . All rights reserved.
      </div>
    </div>
  );

  
}
