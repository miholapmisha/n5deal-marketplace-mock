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
  /** The seller's published assets (never empty: the page explains that case instead). */
  assets: { id: string; title: string }[];
  /** Existing thread per asset id: picking such an asset offers to open it instead. */
  threadByAsset: Record<string, string>;
  defaultBody: string;
}

/** S9 "Contact buyer": pick one of your published assets, write the first message. */
export function ContactBuyerForm({ buyerId, assets, threadByAsset, defaultBody }: ContactBuyerFormProps) {
  const [assetId, setAssetId] = useState(() => (assets.find((asset) => !threadByAsset[asset.id]) ?? assets[0]).id);
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
              {threadByAsset[asset.id] ? `${asset.title} (conversation open)` : asset.title}
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
