"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiAlertLine, RiCheckLine } from "react-icons/ri";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (form.name.length < 2) return "Name must be at least 2 characters";
    if (!form.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Invalid email address";
    if (!form.password) return "Password is required";
    if (form.password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(form.password)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(form.password)) return "Password must contain at least one number";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        return;
      }

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = [
    { label: "8+ characters",    met: form.password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(form.password) },
    { label: "Number",           met: /[0-9]/.test(form.password) },
    { label: "Symbol",           met: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const strengthCount = passwordChecks.filter((check) => check.met).length;
  const strengthColor =
    strengthCount <= 1 ? "var(--color-critical)" :
    strengthCount <= 2 ? "var(--color-high)" :
    strengthCount <= 3 ? "var(--color-progress)" :
    "var(--color-resolved)";

  return (
    <div className="grid min-h-svh lg:grid-cols-2" style={{ background: "var(--background)" }}>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--foreground)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="var(--background)" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="var(--background)" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="var(--background)" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="var(--background)" opacity="0.4" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
              Trackr
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className={cn("flex flex-col gap-5 w-full max-w-sm")}>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
              <p className="text-sm text-muted-foreground text-balance">
                Register to submit and track support requests
              </p>
            </div>

            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 6,
                padding: "10px 12px",
              }}>
                <RiAlertLine size={14} style={{ color: "var(--color-critical)", flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "var(--color-critical)", fontSize: 12, lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 6,
                padding: "10px 12px",
              }}>
                <RiCheckLine size={14} style={{ color: "var(--color-resolved)", flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "var(--color-resolved)", fontSize: 12, lineHeight: 1.5 }}>{success}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="John Doe"
                style={{ fontSize: 13, fontFamily: "inherit" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@company.com"
                style={{ fontSize: 13, fontFamily: "inherit" }}
              />
              <p className="text-xs text-muted-foreground">
                This account can submit requests and track request status.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Password"
                style={{ fontSize: 13, fontFamily: "inherit" }}
              />
              {form.password && (
                <div style={{ marginTop: 2 }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                    {passwordChecks.map((check) => (
                      <div key={check.label} style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 999,
                        background: check.met ? strengthColor : "var(--border)",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {passwordChecks.map((check) => (
                      <span key={check.label} style={{
                        fontSize: 10,
                        color: check.met ? strengthColor : "var(--muted-foreground)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        transition: "color 0.2s",
                      }}>
                        <RiCheckLine size={10} />{check.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password" className="text-xs font-medium">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Confirm password"
                style={{ fontSize: 13, fontFamily: "inherit" }}
              />
              {form.confirmPassword && (
                <p style={{
                  fontSize: 11,
                  color: form.password === form.confirmPassword ? "var(--color-resolved)" : "var(--color-critical)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <RiCheckLine size={10} />
                  {form.password === form.confirmPassword ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !!success}
              className="w-full"
              style={{ fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <span
                onClick={() => router.push("/auth/login")}
                className="text-foreground font-medium cursor-pointer hover:underline underline-offset-4"
              >
                Sign in
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/authbg.jpg"
          alt="Register visual"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
