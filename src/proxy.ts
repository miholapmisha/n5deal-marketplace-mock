import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

export function proxy(request: NextRequest): NextResponse {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/messages/:path*", "/profile/:path*", "/seller/:path*", "/buyers/:path*", "/manager/:path*"],
};
