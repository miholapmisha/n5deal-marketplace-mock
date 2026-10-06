"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { publishAssetAction, unpublishAssetAction } from "@/server/assets/asset.actions";
import type { AssetActionState } from "@/server/assets/asset.schema";

const initialState: AssetActionState = {};

interface AssetStatusToggleProps {
  assetId: string;
  /** Which way the button goes: a draft is published, a published asset is unpublished. */
  mode: "publish" | "unpublish";
}

/** S6 row action: Publish / Unpublish with the service's error shown under it. */
export function AssetStatusToggle({ assetId, mode }: AssetStatusToggleProps) {
  const action = mode === "publish" ? publishAssetAction : unpublishAssetAction;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="assetId" value={assetId} />
      {mode === "publish" ? (
        <SubmitButton size="sm" className="rounded-full" pendingLabel="Publishing…">
          <Eye aria-hidden />
          Publish
        </SubmitButton>
      ) : (
        <SubmitButton size="sm" variant="outline" className="rounded-full" pendingLabel="Unpublishing…">
          <EyeOff aria-hidden />
          Unpublish
        </SubmitButton>
      )}
      {state.error && (
        <p role="alert" className="max-w-56 text-right text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
