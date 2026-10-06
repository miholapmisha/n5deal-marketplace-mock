// Cookie names shared by proxy.ts (edge of the request) and server/auth (the real checks).
// No "server-only" here: proxy.ts imports it, and the names are not secret.

const isProduction = process.env.NODE_ENV === "production";

/**
 * In production the `__Host-` prefix makes the browser refuse the cookie unless it is
 * Secure, Path=/, and has no Domain — so a sibling subdomain cannot plant a session.
 * Plain HTTP on localhost cannot use it, hence the dev name.
 */
export const SESSION_COOKIE = isProduction ? "__Host-n5deal_session" : "n5deal_session";

/** Short-lived, scoped to /suspended: carries the suspension reason to that page. */
export const SUSPENDED_NOTICE_COOKIE = "n5deal_suspended";

export const SECURE_COOKIES = isProduction;
