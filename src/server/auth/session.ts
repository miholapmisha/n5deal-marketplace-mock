import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

import type { Role } from "@/generated/prisma/client";
import { SECURE_COOKIES, SESSION_COOKIE } from "@/lib/session-cookie";
import { deleteSession, findLiveSession, insertSession, pruneSessions } from "@/server/auth/auth.repo";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS_PER_USER = 50;
const TOKEN_BYTES = 32;
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

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await readToken();
  if (!token) return null;

  const session = await findLiveSession(hashToken(token), new Date());
  if (!session || session.user.status !== "ACTIVE") return null;

  const { id, name, email, companyName, role } = session.user;
  return { id, name, email, companyName, role };
});

export async function startSession(userId: string): Promise<void> {
  await endSession();

  const now = new Date();
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await pruneSessions(userId, now, MAX_SESSIONS_PER_USER - 1);
  await insertSession({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export async function endSession(): Promise<void> {
  const token = await readToken();
  if (token) await deleteSession(hashToken(token));

  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
