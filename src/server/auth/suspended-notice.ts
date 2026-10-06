import "server-only";

import { cookies } from "next/headers";

import { SECURE_COOKIES, SUSPENDED_NOTICE_COOKIE } from "@/lib/session-cookie";

const NOTICE_MAX_AGE_SECONDS = 5 * 60;
const MAX_REASON_CODE_POINTS = 300;
const SUSPENDED_PATH = "/suspended";

function truncate(text: string): string {
  const codePoints = Array.from(text);
  return codePoints.length > MAX_REASON_CODE_POINTS
    ? `${codePoints.slice(0, MAX_REASON_CODE_POINTS - 1).join("")}…`
    : text;
}

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
