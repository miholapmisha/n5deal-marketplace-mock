import "server-only";

import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/client";
import { ROLE_HOME } from "@/lib/auth-paths";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
