import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

// Routes that require authentication
const PROTECTED_PATHS = ["/admin", "/agent"];

// Routes only accessible when NOT logged in
const AUTH_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("crm_token")?.value;

  // ── Decode token (null if missing/expired) ───────────
  const payload = token ? await verifyToken(token) : null;
  const isAuthenticated = !!payload;

  // ── 1. Logged-in user hitting /login or /register → redirect to dashboard ──
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const dest =
      payload!.role === "admin" ? "/admin/dashboard" : "/agent/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── 2. Unauthenticated user hitting protected routes → /login ────────────
  if (!isAuthenticated && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Role enforcement: agent can't access /admin ───────────────────────
  if (isAuthenticated && pathname.startsWith("/admin") && payload!.role !== "admin") {
    return NextResponse.redirect(new URL("/agent/dashboard", request.url));
  }

  // ── 4. Role enforcement: admin can't access /agent ───────────────────────
  if (isAuthenticated && pathname.startsWith("/agent") && payload!.role !== "agent") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except static files, images, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
