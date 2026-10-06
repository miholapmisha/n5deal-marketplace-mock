import type { Role } from "@/generated/prisma/enums";

export const ROLE_HOME: Record<Role, string> = {
  BUYER: "/assets",
  SELLER: "/seller/assets",
  MANAGER: "/manager",
};

export const REGISTER_LANDING: Record<"BUYER" | "SELLER", string> = {
  BUYER: "/profile",
  SELLER: "/seller/assets/new",
};

const MAX_NEXT_LENGTH = 512;
const PARSE_BASE = "http://n5deal.invalid";

const UNSAFE_CHARS = /[\u0000-\u001f\u007f\\]/;

export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > MAX_NEXT_LENGTH || UNSAFE_CHARS.test(raw)) {
    return null;
  }
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  try {
    const url = new URL(raw, PARSE_BASE);
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (url.origin !== PARSE_BASE || path.startsWith("//")) return null;
    return path;
  } catch {
    return null;
  }
}
