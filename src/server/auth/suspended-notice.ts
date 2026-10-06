import "server-only";

import { cookies } from "next/headers";

import { SECURE_COOKIES, SUSPENDED_NOTICE_COOKIE } from "@/lib/session-cookie";

// A suspended user never gets a session (SPEC §6.4). After a correct password we hand the
// reason to /suspended in a short-lived cookie scoped to that path, then redirect there.
// The value is shown back only to the browser that proved the password, so a tampered
// cookie can only mislead its own owner.

const NOTICE_MAX_AGE_SECONDS = 5 * 60;
/**
 * Counted in code points, not UTF-16 units: slicing through an emoji's surrogate pair makes
 * the cookie encoder throw. 300 code points stay under the 4 KB cookie limit even when every
 * one is a 4-byte character percent-encoded to 12.
 */
const MAX_REASON_CODE_POINTS = 300;
const SUSPENDED_PATH = "/suspended";

function truncate(text: string): string {
  const codePoints = Array.from(text);
  return codePoints.length > MAX_REASON_CODE_POINTS
    ? `${codePoints.slice(0, MAX_REASON_CODE_POINTS - 1).join("")}…`
    : text;
}

/** Server actions only. */
export async function setSuspendedNotice(reason: string): Promise<void> {
  (await cookies()).set(SUSPENDED_NOTICE_COOKIE, truncate(reason), {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: SUSPENDED_PATH,
    maxAge: NOTICE_MAX_AGE_SECONDS,
  });
}

export async function readSuspendedNotice(): Promise<string | null> {
  const reason = (await cookies()).get(SUSPENDED_NOTICE_COOKIE)?.value?.trim();
  return reason ? truncate(reason) : null;
}
