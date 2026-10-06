"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { REGISTER_LANDING, ROLE_HOME, safeNextPath } from "@/lib/auth-paths";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import {
  type DemoLoginFormState,
  demoLoginSchema,
  type LoginFormState,
  loginSchema,
  type RegisterFormState,
  registerSchema,
} from "@/server/auth/auth.schema";
import { type AuthResult, authenticate, registerUser } from "@/server/auth/auth.service";
import { endSession, startSession } from "@/server/auth/session";
import { setSuspendedNotice } from "@/server/auth/suspended-notice";

const INVALID_CREDENTIALS = "Invalid email or password.";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function enter(result: Exclude<AuthResult, { kind: "invalid" }>, next: string | null): Promise<never> {
  if (result.kind === "suspended") {
    await setSuspendedNotice(result.reason);
    redirect("/suspended");
  }
  await startSession(result.user.id);
  revalidatePath("/", "layout");
  redirect(next ?? ROLE_HOME[result.user.role]);
}

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = field(formData, "email");
  const parsed = loginSchema.safeParse({ email, password: field(formData, "password") });
  if (!parsed.success) return { email, fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (result.kind === "invalid") return { email, error: INVALID_CREDENTIALS };
  return enter(result, safeNextPath(formData.get("next")));
}

export async function demoLoginAction(_prev: DemoLoginFormState, formData: FormData): Promise<DemoLoginFormState> {
  const parsed = demoLoginSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) return { error: "Unknown demo account." };

  const result = await authenticate(DEMO_ACCOUNTS[parsed.data.role], DEMO_PASSWORD);
  if (result.kind === "invalid") return { error: "This demo account is unavailable right now." };
  return enter(result, safeNextPath(formData.get("next")));
}

export async function registerAction(_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  const values = {
    role: field(formData, "role"),
    name: field(formData, "name"),
    companyName: field(formData, "companyName"),
    email: field(formData, "email"),
  };
  const parsed = registerSchema.safeParse({ ...values, password: field(formData, "password") });
  if (!parsed.success) return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const result = await registerUser(parsed.data);
  if (result.kind === "email_taken") {
    return { values, fieldErrors: { email: ["An account with this email already exists. Log in instead."] } };
  }
  await startSession(result.user.id);
  revalidatePath("/", "layout");
  redirect(REGISTER_LANDING[parsed.data.role]);
}

export async function logoutAction(): Promise<void> {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/assets");
}
