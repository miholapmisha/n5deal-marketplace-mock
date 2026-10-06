import "server-only";

import type { Role } from "@/generated/prisma/client";
import { db } from "@/server/db";

// What the rest of the app may know about the logged-in user. Never the password hash.
export const currentUserSelect = {
  id: true,
  name: true,
  email: true,
  companyName: true,
  role: true,
  status: true,
} as const;

export async function findUserForLogin(email: string) {
  return db.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true, statusReason: true, passwordHash: true },
  });
}

interface NewUser {
  email: string;
  passwordHash: string;
  name: string;
  companyName: string | null;
  role: Role;
}

export async function insertUser(data: NewUser) {
  return db.user.create({ data, select: { id: true, role: true } });
}

export async function insertSession(data: { id: string; userId: string; expiresAt: Date }): Promise<void> {
  await db.session.create({ data, select: { id: true } });
}

/** A live session (not expired) with its user, whatever the user's status. */
export async function findLiveSession(id: string, now: Date) {
  return db.session.findUnique({
    where: { id, expiresAt: { gt: now } },
    select: { user: { select: currentUserSelect } },
  });
}

export async function deleteSession(id: string): Promise<void> {
  // deleteMany: no error when the row is already gone (double logout, expired cleanup).
  await db.session.deleteMany({ where: { id } });
}

/** Deletes a user's expired sessions and all but the newest `keep` live ones. */
export async function pruneSessions(userId: string, now: Date, keep: number): Promise<void> {
  const surplus = await db.session.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    skip: keep,
    select: { id: true },
  });
  await db.session.deleteMany({
    where: { userId, OR: [{ expiresAt: { lte: now } }, { id: { in: surplus.map((s) => s.id) } }] },
  });
}
