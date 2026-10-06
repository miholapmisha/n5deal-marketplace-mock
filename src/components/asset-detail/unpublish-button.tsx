"use client";

import { EyeOff } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { unpublishAssetAction } from "@/server/assets/asset.actions";
import type { AssetActionState } from "@/server/assets/asset.schema";

const initialState: AssetActionState = {};

export function UnpublishButton({ assetId }: { assetId: string }) {
  const [state, formAction] = useActionState(unpublishAssetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="assetId" value={assetId} />
      <SubmitButton variant="outline" className="h-10 w-full rounded-full" pendingLabel="Unpublishing…">
        <EyeOff aria-hidden />
        Unpublish
      </SubmitButton>
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
