"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ModerationFormState } from "@/lib/moderation";
import {
  moderateAssetTargetSchema,
  moderateUserTargetSchema,
  moderationInputSchema,
} from "@/server/moderation/moderation.schema";
import { type ModerationResult, moderateAsset, moderateUser } from "@/server/moderation/moderation.service";

// Entry points for the moderation dialogs: parse → service (manager check + rules) →
// revalidate. A moderation changes what the catalog, the buyer directory, message threads,
// and the owner's pages show, so the whole app is revalidated rather than a list of paths.

const STALE_FORM = "This form is out of date. Refresh the page and try again.";

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

type ParsedInput = { ok: true; data: z.output<typeof moderationInputSchema> } | { ok: false; state: ModerationFormState };

function parseInput(formData: FormData): ParsedInput {
  const parsed = moderationInputSchema.safeParse({
    reason: field(formData, "reason"),
    confirmation: field(formData, "confirmation"),
  });
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, state: { error: "Check the highlighted field.", fieldErrors: z.flattenError(parsed.error).fieldErrors } };
}

function finish(result: ModerationResult): ModerationFormState {
  if (!result.ok) {
    return result.field ? { error: result.error, fieldErrors: { [result.field]: [result.error] } } : { error: result.error };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function moderateUserAction(_prev: ModerationFormState, formData: FormData): Promise<ModerationFormState> {
  const target = moderateUserTargetSchema.safeParse({ userId: field(formData, "userId"), action: field(formData, "action") });
  if (!target.success) return { error: STALE_FORM };
  const input = parseInput(formData);
  if (!input.ok) return input.state;

  return finish(await moderateUser({ ...target.data, ...input.data }));
}

export async function moderateAssetAction(_prev: ModerationFormState, formData: FormData): Promise<ModerationFormState> {
  const target = moderateAssetTargetSchema.safeParse({ assetId: field(formData, "assetId"), action: field(formData, "action") });
  if (!target.success) return { error: STALE_FORM };
  const input = parseInput(formData);
  if (!input.ok) return input.state;

  return finish(await moderateAsset({ ...target.data, ...input.data }));
}
