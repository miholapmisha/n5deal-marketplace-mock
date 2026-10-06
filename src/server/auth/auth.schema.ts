import "server-only";

import { z } from "zod";

import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo-accounts";

const BCRYPT_MAX_BYTES = 72;
const PASSWORD_MIN = 8;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, { error: "Email is too long." })
  .pipe(z.email({ pattern: z.regexes.html5Email, error: "Enter a valid email address." }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }).max(256),
});

export const registerSchema = z.object({
  role: z.enum(["BUYER", "SELLER"], { error: "Choose whether you want to buy or sell." }),
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(80, { error: "Name must be at most 80 characters." }),
  companyName: z
    .string()
    .trim()
    .max(120, { error: "Company name must be at most 120 characters." })
    .transform((value) => value || null),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, { error: `Password must be at least ${PASSWORD_MIN} characters.` })
    .refine((value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES, {
      error: `Password must be at most ${BCRYPT_MAX_BYTES} bytes.`,
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const demoLoginSchema = z.object({
  role: z.enum(Object.keys(DEMO_ACCOUNTS) as [DemoRole, ...DemoRole[]]),
});

type FieldErrors<K extends string> = Partial<Record<K, string[]>>;

export interface LoginFormState {
  email: string;
  error?: string;
  fieldErrors?: FieldErrors<"email" | "password">;
}

export interface RegisterFormState {
  values: { role: string; name: string; companyName: string; email: string };
  error?: string;
  fieldErrors?: FieldErrors<"role" | "name" | "companyName" | "email" | "password">;
}

export interface DemoLoginFormState {
  error?: string;
}
