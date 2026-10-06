import type { Role } from "@/generated/prisma/enums";

// Where each role lands after login (SPEC §5 S1). Pure, so proxy, guards, and actions agree.
export const ROLE_HOME: Record<Role, string> = {
  BUYER: "/assets",
  SELLER: "/seller/assets",
  MANAGER: "/manager",
};

/** After registering: Buyer → profile onboarding (S5), Seller → first asset (S7). */
export const REGISTER_LANDING: Record<"BUYER" | "SELLER", string> = {
  BUYER: "/profile",
  SELLER: "/seller/assets/new",
};

const MAX_NEXT_LENGTH = 512;
const PARSE_BASE = "http://n5deal.invalid";

/** Backslashes and control characters (tab, newline…) are rewritten by browser URL parsers. */
const UNSAFE_CHARS = /[\u0000-\u001f\u007f\\]/;

/**
 * A same-origin path such as "/messages?id=1", or null. Rejects absolute URLs and anything
 * a browser could read as protocol-relative ("//evil.com"), including tricks that only turn
 * into "//" after normalization: "/\evil.com", "/\t/evil.com", "/.//evil.com".
 * The *normalized* result is checked again, because that is what we redirect to.
 */
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
