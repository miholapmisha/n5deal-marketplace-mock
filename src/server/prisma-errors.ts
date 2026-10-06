import "server-only";

import { Prisma } from "@/generated/prisma/client";

/** A unique index refused the write (P2002), e.g. a taken slug or a second thread. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
