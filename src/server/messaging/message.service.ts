import "server-only";

import { cache } from "react";

import type { AssetStatus } from "@/generated/prisma/client";
import type { ThreadMessage } from "@/lib/messaging";
import { findPublishedAssetsOf } from "@/server/assets/asset.repo";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";
import { getBuyerDetail } from "@/server/buyers/buyer.service";
import { recordId } from "@/server/form-fields";
import {
  countUnreadConversations,
  findAssetForContact,
  findBuyerForContact,
  findConversationFor,
  findConversationParticipants,
  findConversationsFor,
  findThreadsBetween,
  insertMessage,
  markReadUpTo,
  upsertConversationWithMessage,
} from "@/server/messaging/message.repo";
import { type MatchSignals, matchScore, matchSignals } from "@/server/matching/match-score";
import { rankBy } from "@/server/matching/rank";
import { canViewAsset, isPubliclyVisible } from "@/server/policies/asset-visibility";
import { isBuyerListed } from "@/server/policies/buyer-visibility";
import {
  type ConversationSide,
  conversationSide,
  hasUnread,
  otherSide,
  participantName,
  sendBlockedReason,
} from "@/server/policies/conversation-rules";

const SESSION_EXPIRED = "Your session has expired. Log in again.";
const CONVERSATION_NOT_FOUND = "Conversation not found.";
const ASSET_UNAVAILABLE = "This asset is no longer available: the seller unpublished it, or a manager hid it.";

const CONVERSATION_LIST_LIMIT = 100;
const THREAD_MESSAGE_LIMIT = 200;

export type MessagingResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

type Participant = CurrentUser & { role: ConversationSide };

function isParticipant(user: CurrentUser | null): user is Participant {
  return user?.role === "BUYER" || user?.role === "SELLER";
}

export interface ConversationListItem {
  id: string;
  counterpartName: string;
  assetTitle: string;
  assetCountry: string;
  preview: { body: string; mine: boolean } | null;
  lastMessageAt: Date;
  unread: boolean;
}

export const listConversations = cache(async (): Promise<ConversationListItem[]> => {
  const user = await getCurrentUser();
  if (!isParticipant(user)) return [];

  const rows = await findConversationsFor(user.id, CONVERSATION_LIST_LIMIT);
  return rows.map((row) => {
    const side = conversationSide(row, user.id) ?? user.role;
    const [newest] = row.messages;
    return {
      id: row.id,
      counterpartName: participantName(side === "BUYER" ? row.seller : row.buyer),
      assetTitle: row.asset.title,
      assetCountry: row.asset.country,
      preview: newest ? { body: newest.body, mine: newest.senderId === user.id } : null,
      lastMessageAt: row.lastMessageAt,
      unread: hasUnread(row, side),
    };
  });
});

export async function getUnreadConversationCount(): Promise<number> {
  const user = await getCurrentUser();
  return isParticipant(user) ? countUnreadConversations(user.id) : 0;
}

export interface ConversationView {
  id: string;
  counterpart: {
    name: string;
    personName: string | null;
    side: ConversationSide;
    profileHref: string | null;
  };
  asset: {
    title: string;
    country: string;
    priceEur: number | null;
    href: string | null;
    notice: string | null;
  };
  messages: ThreadMessage[];
  hasEarlier: boolean;
  blockedReason: string | null;
  unread: boolean;
  lastMessageAt: Date;
}

const OWNER_ASSET_NOTICE: Record<AssetStatus, string | null> = {
  DRAFT: "Draft: not in the catalog",
  PUBLISHED: null,
  HIDDEN: "Hidden by a platform manager",
  REMOVED: "Removed by a platform manager",
};

export const getConversationView = cache(async (conversationId: string): Promise<ConversationView | null> => {
  if (!recordId.safeParse(conversationId).success) return null;
  const user = await getCurrentUser();
  if (!isParticipant(user)) return null;

  const row = await findConversationFor(conversationId, user.id, THREAD_MESSAGE_LIMIT);
  const side = row ? conversationSide(row, user.id) : null;
  if (!row || !side) return null;

  const counterpartSide = otherSide(side);
  const counterpart = counterpartSide === "BUYER" ? row.buyer : row.seller;
  const assetFacts = { ...row.asset, seller: { status: row.seller.status } };
  const isPublic = isPubliclyVisible(assetFacts);

  return {
    id: row.id,
    counterpart: {
      name: participantName(counterpart),
      personName: counterpart.status !== "REMOVED" && counterpart.companyName ? counterpart.name : null,
      side: counterpartSide,
      profileHref: side === "SELLER" && isBuyerListed(row.buyer) ? `/buyers/${row.buyer.id}` : null,
    },
    asset: {
      title: row.asset.title,
      country: row.asset.country,
      priceEur: row.asset.priceEur,
      href: canViewAsset(assetFacts, user) ? `/assets/${row.asset.slug}` : null,
      notice: isPublic ? null : side === "SELLER" ? OWNER_ASSET_NOTICE[row.asset.status] : "No longer listed in the catalog",
    },
    messages: row.messages
      .slice(0, THREAD_MESSAGE_LIMIT)
      .toReversed()
      .map((message) => ({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        mine: message.senderId === user.id,
      })),
    hasEarlier: row.messages.length > THREAD_MESSAGE_LIMIT,
    blockedReason: sendBlockedReason(counterpart, counterpartSide),
    unread: hasUnread(row, side),
    lastMessageAt: row.lastMessageAt,
  };
});

export async function sendMessage(conversationId: string, body: string): Promise<MessagingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };

  const conversation = await findConversationParticipants(conversationId);
  const side = conversation ? conversationSide(conversation, user.id) : null;
  if (!conversation || !side) return { ok: false, error: CONVERSATION_NOT_FOUND };

  const counterpartSide = otherSide(side);
  const counterpart = counterpartSide === "BUYER" ? conversation.buyer : conversation.seller;
  const blocked = sendBlockedReason(counterpart, counterpartSide);
  if (blocked) return { ok: false, error: blocked };

  await insertMessage(conversation.id, { id: user.id, side }, body);
  return { ok: true };
}

export async function startConversation(
  assetId: string,
  body: string,
): Promise<MessagingResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  if (user.role !== "BUYER") return { ok: false, error: "Only buyers can contact a seller about an asset." };

  const asset = await findAssetForContact(assetId);
  if (!asset || !isPubliclyVisible(asset)) return { ok: false, error: ASSET_UNAVAILABLE };

  const conversationId = await upsertConversationWithMessage({
    assetId: asset.id,
    buyerId: user.id,
    sellerId: asset.sellerId,
    side: "BUYER",
    body,
  });
  return { ok: true, conversationId };
}

export async function contactBuyer(
  buyerId: string,
  assetId: string,
  body: string,
): Promise<MessagingResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  if (user.role !== "SELLER") return { ok: false, error: "Only sellers can contact buyers." };

  const [asset, buyer] = await Promise.all([findAssetForContact(assetId), findBuyerForContact(buyerId)]);
  if (!asset || asset.sellerId !== user.id) return { ok: false, error: "Asset not found." };
  if (asset.status !== "PUBLISHED") {
    return { ok: false, error: "This asset is not published any more. Pick a published asset." };
  }
  if (!buyer || !isBuyerListed(buyer)) return { ok: false, error: "This buyer is no longer available." };

  const conversationId = await upsertConversationWithMessage({
    assetId: asset.id,
    buyerId: buyer.id,
    sellerId: user.id,
    side: "SELLER",
    body,
  });
  return { ok: true, conversationId };
}

export async function markConversationRead(conversationId: string, seenAt: Date): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const conversation = await findConversationParticipants(conversationId);
  const side = conversation ? conversationSide(conversation, user.id) : null;
  if (!conversation || !side) return false;

  const upTo = seenAt < conversation.lastMessageAt ? seenAt : conversation.lastMessageAt;
  return markReadUpTo(conversation.id, { id: user.id, side }, upTo);
}

export interface ContactAssetOption {
  id: string;
  slug: string;
  title: string;
  match: number;
  signals: MatchSignals;
}

export interface ContactBuyerOptions {
  assets: ContactAssetOption[];
  threads: { id: string; assetId: string; assetTitle: string }[];
}

export async function getContactBuyerOptions(buyerId: string): Promise<ContactBuyerOptions | null> {
  const [user, buyer] = await Promise.all([getCurrentUser(), getBuyerDetail(buyerId)]);
  if (user?.role !== "SELLER" || !buyer) return null;

  const [assets, threads] = await Promise.all([findPublishedAssetsOf(user.id), findThreadsBetween(buyer.id, user.id)]);
  const ranked = rankBy(assets, (asset) => matchScore(asset, buyer.profile), (asset) => asset.publishedAt);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return {
    assets: ranked.flatMap(({ id, score }) => {
      const asset = byId.get(id);
      return asset
        ? [{ id, slug: asset.slug, title: asset.title, match: score, signals: matchSignals(asset, buyer.profile) }]
        : [];
    }),
    threads: threads.map((thread) => ({ id: thread.id, assetId: thread.assetId, assetTitle: thread.asset.title })),
  };
}
