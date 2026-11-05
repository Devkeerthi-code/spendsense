import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];
const APP_PATHS = ["/dashboard", "/transactions", "/import", "/budgets", "/settings"];

/**
 * Cheap routing gate: checks that a session cookie exists. Every page and API route verifies the session
 * properly, so a forged cookie gets nothing. Signed-in users are sent away from /login by the auth layout,
 * which can check the cookie is actually valid.
 */
export function proxy(req: NextRequest) {
  const signedIn = SESSION_COOKIES.some((name) => req.cookies.has(name));
  const { pathname } = req.nextUrl;
  const isApp = APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isApp && !signedIn) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/import/:path*", "/budgets/:path*", "/settings/:path*"],
};
