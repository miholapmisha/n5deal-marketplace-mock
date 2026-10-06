import "server-only";

import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/client";
import { ROLE_HOME } from "@/lib/auth-paths";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";

// Called by pages and services — the real access checks. proxy.ts only pre-filters for UX.

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Wrong role → the user's own home, which always admits them, so this cannot loop. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
