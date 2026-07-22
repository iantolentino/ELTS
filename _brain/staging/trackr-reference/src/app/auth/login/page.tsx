"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiAlertLine, RiTimeLine } from "react-icons/ri";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") ?? "/tickets";
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    
    setLoading(true);
    setError("");
    try {
      const statusRes  = await fetch("/api/auth/check-status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const statusData = await statusRes.json();
      

      if (statusData.status === "PENDING") {
        setError("Your account is pending approval from an administrator.");
        setLoading(false);
        return;
      }
      if (statusData.status === "REJECTED") {
        setError("Your account has been rejected. Please contact your administrator.");
        setLoading(false);
        return;
      }

      const { signIn } = await import("next-auth/react");
      const res = await signIn("credentials", { email, password, redirect: false });

      if (res?.ok && !res?.error) {
        window.location.href = redirect;
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPending = error.includes("pending");

  return (
    <div
      className="grid min-h-svh lg:grid-cols-2"
      style={{ background: "var(--background)" }}
    >
      {/* ── Left — Form ── */}
      <div className="flex flex-col gap-4 p-6 md:p-10">

        {/* Logo */}
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

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className={cn("flex flex-col gap-5 w-full max-w-xs")}>

            {/* Header */}
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground text-balance">
                Enter your email below to sign in to your account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display:      "flex",
                alignItems:   "flex-start",
                gap:          8,
                background:   isPending ? "rgba(251,146,60,0.06)" : "rgba(248,113,113,0.06)",
                border:       `1px solid ${isPending ? "rgba(251,146,60,0.2)" : "rgba(248,113,113,0.2)"}`,
                borderRadius: 6,
                padding:      "10px 12px",
              }}>
                {isPending
                  ? <RiTimeLine  size={14} style={{ color: "var(--color-high)",     flexShrink: 0, marginTop: 1 }} />
                  : <RiAlertLine size={14} style={{ color: "var(--color-critical)", flexShrink: 0, marginTop: 1 }} />
                }
                <span style={{
                  color:      isPending ? "var(--color-high)" : "var(--color-critical)",
                  fontSize:   12,
                  lineHeight: 1.5,
                }}>
                  {error}
                </span>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="admin@trackr.dev"
                style={{ fontSize: 13, fontFamily: "inherit" }}
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                style={{ fontSize: 13, fontFamily: "inherit" }}
                required
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full"
              style={{ fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <span
                onClick={() => router.push("/auth/register")}
                className="text-foreground font-medium cursor-pointer underline underline-offset-4"
              >
                Register
              </span>
            </p>

            {/* Demo credentials */}
            <div style={{
              padding:      "10px 12px",
              background:   "var(--muted)",
              borderRadius: 6,
              textAlign:    "center",
            }}>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Demo credentials</p>
              <p className="text-xs text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                admin@trackr.dev · password123
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Right — Image ── */}
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/authbg.jpg"
          alt="Login visual"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
