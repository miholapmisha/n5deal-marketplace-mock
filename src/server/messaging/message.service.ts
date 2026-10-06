import "server-only";

import { cache } from "react";

import type { AssetStatus } from "@/generated/prisma/client";
import type { ThreadMessage } from "@/lib/messaging";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";
import { recordId } from "@/server/form-fields";
import {
  countUnreadConversations,
  findAssetForContact,
  findBuyerForContact,
  findConversationFor,
  findConversationParticipants,
  findConversationsFor,
  findPublishedAssetsOf,
  findThreadsBetween,
  insertMessage,
  markReadUpTo,
  upsertConversationWithMessage,
} from "@/server/messaging/message.repo";
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

/** Bounds for one render. Older items stay in the database (cursor pagination: SPEC §13). */
const CONVERSATION_LIST_LIMIT = 100;
const THREAD_MESSAGE_LIMIT = 200;

export type MessagingResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

type Participant = CurrentUser & { role: ConversationSide };

/** Buyers and sellers have conversations; managers and visitors do not. */
function isParticipant(user: CurrentUser | null): user is Participant {
  return user?.role === "BUYER" || user?.role === "SELLER";
}

// ─── Conversation list + header count (S2) ───────────────────────────────────────────────

export interface ConversationListItem {
  id: string;
  counterpartName: string;
  assetTitle: string;
  assetCountry: string;
  /** The newest message. Threads are created with their first message, so it always exists. */
  preview: { body: string; mine: boolean } | null;
  lastMessageAt: Date;
  unread: boolean;
}

/** The viewer's conversations. Memoized per request: the layout and the page both ask. */
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

/** The header badge: conversations with something the viewer has not read. */
export async function getUnreadConversationCount(): Promise<number> {
  const user = await getCurrentUser();
  return isParticipant(user) ? countUnreadConversations(user.id) : 0;
}

// ─── One thread (S2) ─────────────────────────────────────────────────────────────────────

export interface ConversationView {
  id: string;
  counterpart: {
    name: string;
    /** The person behind the company name, when both are known. */
    personName: string | null;
    side: ConversationSide;
    /** S9, for a seller looking at a buyer whose profile is listed. */
    profileHref: string | null;
  };
  asset: {
    title: string;
    country: string;
    priceEur: number | null;
    /** Null when the viewer may no longer open the asset page. */
    href: string | null;
    /** Why the asset is not in the catalog, or null when it is. */
    notice: string | null;
  };
  /** Oldest first. */
  messages: ThreadMessage[];
  /** More messages exist than the thread shows. */
  hasEarlier: boolean;
  /** Set when the viewer cannot reply (SPEC §4.2). */
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

/** The thread, or null (→ 404) when it does not exist or the viewer is not part of it. */
export const getConversationView = cache(async (conversationId: string): Promise<ConversationView | null> => {
  if (!recordId.safeParse(conversationId).success) return null;
  const user = await getCurrentUser();
  if (!isParticipant(user)) return null;

  const row = await findConversationFor(conversationId, user.id, THREAD_MESSAGE_LIMIT);
  const side = row ? conversationSide(row, user.id) : null;
  if (!row || !side) return null;

  const counterpartSide = otherSide(side);
  const counterpart = counterpartSide === "BUYER" ? row.buyer : row.seller;
  // The thread's seller is the asset's seller: assets never change owner.
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

// ─── Writes ──────────────────────────────────────────────────────────────────────────────

/** A reply. Refused when the counterpart is no longer active. */
export async function sendMessage(conversationId: string, body: string): Promise<MessagingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };

  const conversation = await findConversationParticipants(conversationId);
  const side = conversation ? conversationSide(conversation, user.id) : null;
  // Same answer for "missing" and "not yours", so conversation IDs cannot be probed.
  if (!conversation || !side) return { ok: false, error: CONVERSATION_NOT_FOUND };

  const counterpartSide = otherSide(side);
  const counterpart = counterpartSide === "BUYER" ? conversation.buyer : conversation.seller;
  const blocked = sendBlockedReason(counterpart, counterpartSide);
  if (blocked) return { ok: false, error: blocked };

  await insertMessage(conversation.id, { id: user.id, side }, body);
  return { ok: true };
}

/** Buyer → seller from an asset the buyer can see (S4). Reuses an existing thread. */
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

/** Seller → buyer about one of the seller's own published assets (S9). Reuses a thread. */
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

/**
 * Marks the thread read up to `seenAt` (the newest message the viewer was shown), capped at
 * the newest message that exists. True if anything changed.
 */
export async function markConversationRead(conversationId: string, seenAt: Date): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const conversation = await findConversationParticipants(conversationId);
  const side = conversation ? conversationSide(conversation, user.id) : null;
  if (!conversation || !side) return false;

  const upTo = seenAt < conversation.lastMessageAt ? seenAt : conversation.lastMessageAt;
  return markReadUpTo(conversation.id, { id: user.id, side }, upTo);
}

// ─── Contact a buyer (S9) ────────────────────────────────────────────────────────────────

export interface ContactBuyerOptions {
  /** The seller's published assets, newest first. */
  assets: { id: string; title: string }[];
  /** Existing threads with this buyer, any asset status. */
  threads: { id: string; assetId: string; assetTitle: string }[];
}

/** What the "Contact buyer" form offers this seller. Null for anyone who is not a seller. */
export async function getContactBuyerOptions(buyerId: string): Promise<ContactBuyerOptions | null> {
  const user = await getCurrentUser();
  if (user?.role !== "SELLER") return null;

  const [assets, threads] = await Promise.all([findPublishedAssetsOf(user.id), findThreadsBetween(buyerId, user.id)]);
  return {
    assets,
    threads: threads.map((thread) => ({ id: thread.id, assetId: thread.assetId, assetTitle: thread.asset.title })),
  };
}
