import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NewConversationForm } from "@/components/messaging/new-conversation-form";
import { ThreadHeader } from "@/components/messaging/thread-header";
import { conversationPath } from "@/lib/messaging";
import { getAssetDetail } from "@/server/assets/asset.service";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Contact seller",
};

export default async function NewConversationPage({ searchParams }: PageProps<"/messages/new">) {
  await requireRole("BUYER");
  const { asset: slug } = await searchParams;
  const view = typeof slug === "string" ? await getAssetDetail(slug) : null;
  if (!view || !view.isPublic) notFound();
  if (view.conversationId) redirect(conversationPath(view.conversationId));
  const { asset } = view;

  return (
    <>
      <ThreadHeader
        title="Verified seller"
        subtitle="New conversation"
        asset={{ title: asset.title, country: asset.country, priceEur: asset.priceEur, href: `/assets/${asset.slug}`, notice: null }}
      />
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto p-4">
        <div className="flex items-start gap-3 rounded-xl bg-secondary p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p>
            Your message goes to the seller of this asset. Their company name is shared with you once the
            conversation starts.
          </p>
        </div>
        <NewConversationForm
          assetId={asset.id}
          defaultBody={`Hello, I am interested in “${asset.title}”. Could you share more details about the business and the next steps?`}
        />
      </div>
    </>
  );
}
