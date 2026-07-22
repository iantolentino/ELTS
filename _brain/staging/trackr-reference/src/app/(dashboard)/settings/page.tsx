"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiSunLine, RiMoonLine } from "react-icons/ri";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="App preferences and configuration"
      />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--background)" }}>

        {/* Appearance */}
        <Card style={{ maxWidth: 520, marginBottom: 10 }}>
          <CardHeader style={{ padding: "16px 20px 0" }}>
            <CardTitle style={{ fontSize: 14, fontWeight: 600 }}>Appearance</CardTitle>
            <CardDescription style={{ fontSize: 12 }}>Customize how Trackr looks</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Theme</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                  {mounted ? (
                    <>Currently using <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{theme === "dark" ? "Dark" : "Light"}</span> mode</>
                  ) : "Loading..."}
                </div>
              </div>

              {/* Toggle */}
              <div style={{ display: "flex", background: "var(--muted)", borderRadius: 8, padding: 3, gap: 2 }}>
                <Button
                  variant={mounted && theme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  style={{ fontSize: 12, gap: 6, fontFamily: "inherit", height: 30 }}
                >
                  <RiMoonLine size={13} /> Dark
                </Button>
                <Button
                  variant={mounted && theme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  style={{ fontSize: 12, gap: 6, fontFamily: "inherit", height: 30 }}
                >
                  <RiSunLine size={13} /> Light
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card style={{ maxWidth: 520 }}>
          <CardHeader style={{ padding: "16px 20px 0" }}>
            <CardTitle style={{ fontSize: 14, fontWeight: 600 }}>Account</CardTitle>
            <CardDescription style={{ fontSize: 12 }}>Manage your account details</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "16px 20px" }}>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
              More settings coming soon
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}