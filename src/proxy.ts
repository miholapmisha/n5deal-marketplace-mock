import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

// UX only (SPEC §6.3): visitors with no session cookie are sent to /login before a private
// page renders, with ?next= so they come back afterwards. This never grants access — the
// cookie may be expired, forged, or belong to a suspended user. requireRole() in each page
// and the services make the real decision against the database.
export function proxy(request: NextRequest): NextResponse {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/messages/:path*", "/profile/:path*", "/seller/:path*", "/buyers/:path*", "/manager/:path*"],
};
