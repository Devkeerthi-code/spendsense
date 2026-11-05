import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];
const APP_PATHS = ["/dashboard", "/transactions", "/import", "/budgets", "/settings"];
const AUTH_PATHS = ["/login", "/signup"];

/**
 * Cheap routing gate: checks that a session cookie exists. Every page and API route verifies the session
 * properly, so a forged cookie gets nothing.
 */
export function proxy(req: NextRequest) {
  const signedIn = SESSION_COOKIES.some((name) => req.cookies.has(name));
  const { pathname } = req.nextUrl;
  const isApp = APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isApp && !signedIn) return NextResponse.redirect(new URL("/login", req.url));
  if (signedIn && AUTH_PATHS.includes(pathname)) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/transactions/:path*", "/import/:path*", "/budgets/:path*", "/settings/:path*"],
};
