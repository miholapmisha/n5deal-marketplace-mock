import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

import type { Role } from "@/generated/prisma/client";
import { SECURE_COOKIES, SESSION_COOKIE } from "@/lib/session-cookie";
import { deleteSession, findLiveSession, insertSession, pruneSessions } from "@/server/auth/auth.repo";

// SPEC §6.4 — database sessions. The browser holds a random token; the database holds only
// its SHA-256. A leaked database therefore cannot be replayed as cookies, and deleting a row
// (logout, suspension) ends that session on the very next request.

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * Bounds the Session table when a script logs in over and over. Generous because the demo
 * accounts are shared: every evaluator who clicks "Enter as Buyer" holds a buyer session.
 */
const MAX_SESSIONS_PER_USER = 50;
const TOKEN_BYTES = 32;
/** 32 random bytes in base64url are exactly 43 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  role: Role;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const cookieOptions = {
  httpOnly: true,
  secure: SECURE_COOKIES,
  sameSite: "lax",
  path: "/",
} as const;

async function readToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

/**
 * The logged-in user, or null. Memoized per request with React `cache()`, so a header, a
 * page, and three services asking in one render cost one query. Users who are not ACTIVE
 * get null even if a session row exists, so suspension can never be bypassed by a race.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await readToken();
  if (!token) return null;

  const session = await findLiveSession(hashToken(token), new Date());
  if (!session || session.user.status !== "ACTIVE") return null;

  const { id, name, email, companyName, role } = session.user;
  return { id, name, email, companyName, role };
});

/** Server actions only (cookies are writable there, not while rendering). */
export async function startSession(userId: string): Promise<void> {
  // Never reuse a token that existed before login (session fixation).
  await endSession();

  const now = new Date();
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await pruneSessions(userId, now, MAX_SESSIONS_PER_USER - 1);
  await insertSession({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

/** Server actions only. Deletes the row first: even if the cookie survives, it is dead. */
export async function endSession(): Promise<void> {
  const token = await readToken();
  if (token) await deleteSession(hashToken(token));

  // Same attributes as when set: a `__Host-` cookie can only be cleared by a Secure Set-Cookie.
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
