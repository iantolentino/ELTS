// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn   = !!req.auth;
  const role         = (req.auth?.user as any)?.role ?? "REQUESTER";

  const isAuthPage   = pathname.startsWith("/auth");
  const isPortal     = pathname.startsWith("/portal");
  const isApiAuth    = pathname.startsWith("/api/auth");
  const isApiPublic  =
    (pathname === "/api/users" && req.method === "POST") ||
    (pathname === "/api/departments" && req.method === "GET") ||
    (pathname.startsWith("/api/departments/") && req.method === "GET") ||
    pathname === "/api/auth/check-status";

  // ── Always allow ────────────────────────────────────────────────
  if (isApiAuth || isApiPublic || isPortal) return NextResponse.next();

  // ── Root → portal ───────────────────────────────────────────────
  if (pathname === "/") return NextResponse.redirect(new URL("/portal", req.url));

  // ── Auth pages — redirect logged-in users to tickets ───────────
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL(role === "REQUESTER" ? "/portal/my-requests" : "/tickets", req.url));
  }

  // ── Protected pages — redirect guests to login ──────────────────
  if (!isLoggedIn && !isAuthPage) return NextResponse.redirect(new URL("/auth/login", req.url));

  if (isLoggedIn && role === "REQUESTER" && !isAuthPage) {
    return NextResponse.redirect(new URL("/portal/my-requests", req.url));
  }

  if (isLoggedIn && role === "MEMBER" && ["/team", "/reports", "/settings"].some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/tickets", req.url));
  }

  if (isLoggedIn && role === "MANAGER" && pathname.startsWith("/settings")) {
    return NextResponse.redirect(new URL("/tickets", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
