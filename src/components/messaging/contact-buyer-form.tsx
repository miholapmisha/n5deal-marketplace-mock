"use client";

import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Field, selectClass } from "@/components/forms/field";
import { MessageComposer } from "@/components/messaging/message-composer";
import { Button } from "@/components/ui/button";
import { conversationPath } from "@/lib/messaging";
import { contactBuyerAction } from "@/server/messaging/message.actions";

interface ContactBuyerFormProps {
  buyerId: string;
  assets: { id: string; title: string; match: number }[];
  threadByAsset: Record<string, string>;
  initialAssetId: string | null;
  defaultBody: string;
}

function initialAsset(
  assets: ContactBuyerFormProps["assets"],
  threadByAsset: Record<string, string>,
  initialAssetId: string | null,
): string {
  const preselected = assets.find((asset) => asset.id === initialAssetId);
  return (preselected ?? assets.find((asset) => !threadByAsset[asset.id]) ?? assets[0]).id;
}

export function ContactBuyerForm({ buyerId, assets, threadByAsset, initialAssetId, defaultBody }: ContactBuyerFormProps) {
  const [assetId, setAssetId] = useState(() => initialAsset(assets, threadByAsset, initialAssetId));
  const existingThread = threadByAsset[assetId];

  async function send(body: string): Promise<string | null> {
    const result = await contactBuyerAction({ buyerId, assetId, body });
    return result.error ?? null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Field id="contact-asset" label="About which asset?">
        <select
          id="contact-asset"
          value={assetId}
          onChange={(event) => setAssetId(event.target.value)}
          className={selectClass}
        >
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {`${asset.title} · ${asset.match}% match${threadByAsset[asset.id] ? " (conversation open)" : ""}`}
            </option>
          ))}
        </select>
      </Field>

      {existingThread ? (
        <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 text-sm">
          <p>You already have a conversation with this buyer about this asset.</p>
          <Button asChild className="h-10 rounded-full">
            <Link href={conversationPath(existingThread)}>
              <MessagesSquare aria-hidden />
              Open conversation
            </Link>
          </Button>
        </div>
      ) : (
        <MessageComposer label="Your first message" defaultBody={defaultBody} roomy onSend={send} />
      )}
    </div>
  );
}
