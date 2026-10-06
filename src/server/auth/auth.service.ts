import "server-only";

import bcrypt from "bcryptjs";

import { Prisma, type Role } from "@/generated/prisma/client";
import { findUserForLogin, insertUser } from "@/server/auth/auth.repo";
import type { RegisterInput } from "@/server/auth/auth.schema";

const BCRYPT_COST = 10;

const TIMING_DUMMY_HASH = "$2b$10$kCX2WZhEBsczuxIgZyzlUO39j54icDGMPhqB.IVxbgSLHqc85HMo6";

const MISSING_REASON = "No reason was recorded. Please contact the N5Deal team.";

export type AuthResult =
  | { kind: "ok"; user: { id: string; role: Role } }
  | { kind: "suspended"; reason: string }
  | { kind: "invalid" };

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const user = await findUserForLogin(email);
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? TIMING_DUMMY_HASH);

  if (!user || !passwordMatches || user.status === "REMOVED") return { kind: "invalid" };
  if (user.status === "SUSPENDED") return { kind: "suspended", reason: user.statusReason ?? MISSING_REASON };
  return { kind: "ok", user: { id: user.id, role: user.role } };
}

export type RegisterResult = { kind: "ok"; user: { id: string; role: Role } } | { kind: "email_taken" };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  try {
    const user = await insertUser({
      email: input.email,
      passwordHash,
      name: input.name,
      companyName: input.companyName,
      role: input.role,
    });
    return { kind: "ok", user };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { kind: "email_taken" };
    }
    throw error;
  }
}
