import "server-only";

import { db } from "@/server/db";
import { type ConversationSide, participantWhere } from "@/server/policies/conversation-rules";
import { isUniqueViolation } from "@/server/prisma-errors";

const personSelect = { id: true, name: true, companyName: true, status: true } as const;

const readStateSelect = {
  id: true,
  buyerId: true,
  sellerId: true,
  lastMessageAt: true,
  buyerLastRead: true,
  sellerLastRead: true,
} as const;

// ─── Reads ───────────────────────────────────────────────────────────────────────────────

/** The user's conversations, most recent activity first, each with its newest message. */
export async function findConversationsFor(userId: string, take: number) {
  return db.conversation.findMany({
    where: participantWhere(userId),
    orderBy: [{ lastMessageAt: "desc" }, { id: "asc" }],
    take,
    select: {
      ...readStateSelect,
      asset: { select: { title: true, country: true } },
      buyer: { select: personSelect },
      seller: { select: personSelect },
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { body: true, senderId: true } },
    },
  });
}

/**
 * Conversations with a message newer than the user's read marker. One COUNT: Prisma field
 * references compare two columns of the same row in SQL.
 */
export async function countUnreadConversations(userId: string): Promise<number> {
  const { fields } = db.conversation;
  return db.conversation.count({
    where: {
      OR: [
        { buyerId: userId, OR: [{ buyerLastRead: null }, { lastMessageAt: { gt: fields.buyerLastRead } }] },
        { sellerId: userId, OR: [{ sellerLastRead: null }, { lastMessageAt: { gt: fields.sellerLastRead } }] },
      ],
    },
  });
}

/**
 * One thread, only if the user takes part in it, with its newest `messageLimit + 1` messages
 * (newest first; the extra one tells the caller that older messages exist).
 */
export async function findConversationFor(conversationId: string, userId: string, messageLimit: number) {
  return db.conversation.findFirst({
    where: { AND: [{ id: conversationId }, participantWhere(userId)] },
    select: {
      ...readStateSelect,
      asset: {
        select: { id: true, slug: true, title: true, country: true, category: true, priceEur: true, status: true, sellerId: true },
      },
      buyer: { select: { ...personSelect, role: true, buyerProfile: { select: { isVisible: true } } } },
      seller: { select: personSelect },
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: messageLimit + 1,
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });
}

/** Who takes part and whether they may still write. For replies and read markers. */
export async function findConversationParticipants(conversationId: string) {
  return db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      lastMessageAt: true,
      buyer: { select: { status: true } },
      seller: { select: { status: true } },
    },
  });
}

/** What starting a conversation about an asset needs to check. */
export async function findAssetForContact(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, slug: true, sellerId: true, status: true, seller: { select: { status: true } } },
  });
}

/** What a seller contacting a buyer needs to check. */
export async function findBuyerForContact(buyerId: string) {
  return db.user.findUnique({
    where: { id: buyerId },
    select: { id: true, role: true, status: true, buyerProfile: { select: { isVisible: true } } },
  });
}

/** Threads between one buyer and one seller (one per asset), most recent first. */
export async function findThreadsBetween(buyerId: string, sellerId: string) {
  return db.conversation.findMany({
    where: { buyerId, sellerId },
    orderBy: [{ lastMessageAt: "desc" }, { id: "asc" }],
    select: { id: true, assetId: true, asset: { select: { title: true } } },
  });
}

// ─── Writes ──────────────────────────────────────────────────────────────────────────────

/** The sender has read everything up to their own message. */
function readBy(side: ConversationSide, at: Date) {
  return side === "BUYER" ? { buyerLastRead: at } : { sellerLastRead: at };
}

/** Appends a reply and moves the thread to the top of both lists. */
export async function insertMessage(
  conversationId: string,
  sender: { id: string; side: ConversationSide },
  body: string,
): Promise<void> {
  const now = new Date();
  await db.$transaction([
    db.message.create({ data: { conversationId, senderId: sender.id, body, createdAt: now }, select: { id: true } }),
    db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now, ...readBy(sender.side, now) },
      select: { id: true },
    }),
  ]);
}

interface FirstMessage {
  assetId: string;
  buyerId: string;
  sellerId: string;
  /** Who writes this message; becomes `initiatedBy` if the thread is new. */
  side: ConversationSide;
  body: string;
}

const UPSERT_ATTEMPTS = 2;

/**
 * Opens the buyer's thread about the asset, or reuses the existing one (one thread per buyer
 * per asset, enforced by the unique index), and appends the message. Returns the thread id.
 *
 * Two first messages racing each other can both miss the existing row; the loser's insert
 * fails with P2002, which aborts its transaction, so the whole transaction runs once more
 * and then finds the winner's thread.
 */
export async function upsertConversationWithMessage(input: FirstMessage): Promise<string> {
  const { assetId, buyerId, sellerId, side, body } = input;
  const senderId = side === "BUYER" ? buyerId : sellerId;

  for (let attempt = 1; ; attempt++) {
    const now = new Date();
    try {
      return await db.$transaction(async (tx) => {
        const conversation = await tx.conversation.upsert({
          where: { assetId_buyerId: { assetId, buyerId } },
          create: { assetId, buyerId, sellerId, initiatedBy: side, createdAt: now, lastMessageAt: now, ...readBy(side, now) },
          update: { lastMessageAt: now, ...readBy(side, now) },
          select: { id: true },
        });
        await tx.message.create({
          data: { conversationId: conversation.id, senderId, body, createdAt: now },
          select: { id: true },
        });
        return conversation.id;
      });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= UPSERT_ATTEMPTS) throw error;
    }
  }
}

/**
 * Moves one side's read marker forward to `seenAt`, never backward, and only for the user on
 * that side. True if it moved.
 */
export async function markReadUpTo(
  conversationId: string,
  reader: { id: string; side: ConversationSide },
  seenAt: Date,
): Promise<boolean> {
  const where =
    reader.side === "BUYER"
      ? { id: conversationId, buyerId: reader.id, OR: [{ buyerLastRead: null }, { buyerLastRead: { lt: seenAt } }] }
      : { id: conversationId, sellerId: reader.id, OR: [{ sellerLastRead: null }, { sellerLastRead: { lt: seenAt } }] };
  const { count } = await db.conversation.updateMany({ where, data: readBy(reader.side, seenAt) });
  return count === 1;
}
