import "server-only";

import { z } from "zod";

/** Asset IDs are cuids in production and `ast_<n>` in the seed. */
export const assetIdSchema = z.object({
  assetId: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{1,64}$/i),
});

/** Returned to `useActionState` by owner actions on an asset. */
export interface AssetActionState {
  error?: string;
}
