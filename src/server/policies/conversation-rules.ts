import "server-only";

import type { Prisma, UserStatus } from "@/generated/prisma/client";

// SPEC §4.2 — who takes part in a conversation, who may still write, and what is unread.
// Pure functions plus a `where` builder, like the asset visibility rules.

export type ConversationSide = "BUYER" | "SELLER";

interface Participants {
  buyerId: string;
  sellerId: string;
}

/** The user's side of the thread, or null when they are not part of it. */
export function conversationSide(conversation: Participants, userId: string): ConversationSide | null {
  if (conversation.buyerId === userId) return "BUYER";
  if (conversation.sellerId === userId) return "SELLER";
  return null;
}

export function otherSide(side: ConversationSide): ConversationSide {
  return side === "BUYER" ? "SELLER" : "BUYER";
}

/** Conversations the user takes part in. Every messaging query starts from this. */
export function participantWhere(userId: string): Prisma.ConversationWhereInput {
  return { OR: [{ buyerId: userId }, { sellerId: userId }] };
}

interface ReadState {
  lastMessageAt: Date;
  buyerLastRead: Date | null;
  sellerLastRead: Date | null;
}

/**
 * Something arrived after this side last read. Sending sets the sender's read marker to the
 * new message, so a thread never looks unread because of your own message.
 */
export function hasUnread(conversation: ReadState, side: ConversationSide): boolean {
  const lastRead = side === "BUYER" ? conversation.buyerLastRead : conversation.sellerLastRead;
  return lastRead === null || conversation.lastMessageAt > lastRead;
}

interface Participant {
  name: string;
  companyName: string | null;
  status: UserStatus;
}

export const REMOVED_USER_NAME = "Removed user";

/** Company first (that is who the deal is with). Removed users are never named. */
export function participantName(person: Participant): string {
  return person.status === "REMOVED" ? REMOVED_USER_NAME : (person.companyName ?? person.name);
}

/**
 * Why the viewer cannot write to this thread, or null if they can. The viewer is always
 * ACTIVE (other users have no session), so only the counterpart's status matters.
 */
export function sendBlockedReason(counterpart: { status: UserStatus }, counterpartSide: ConversationSide): string | null {
  const who = counterpartSide === "BUYER" ? "buyer" : "seller";
  switch (counterpart.status) {
    case "ACTIVE":
      return null;
    case "SUSPENDED":
      return `This ${who}'s account is suspended. You can still read the conversation, but you cannot reply.`;
    case "REMOVED":
      return `This ${who} has been removed from the platform. The conversation is read-only.`;
  }
}
