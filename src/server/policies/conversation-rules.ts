import "server-only";

import type { Prisma, UserStatus } from "@/generated/prisma/client";

export type ConversationSide = "BUYER" | "SELLER";

interface Participants {
  buyerId: string;
  sellerId: string;
}

export function conversationSide(conversation: Participants, userId: string): ConversationSide | null {
  if (conversation.buyerId === userId) return "BUYER";
  if (conversation.sellerId === userId) return "SELLER";
  return null;
}

export function otherSide(side: ConversationSide): ConversationSide {
  return side === "BUYER" ? "SELLER" : "BUYER";
}

export function participantWhere(userId: string): Prisma.ConversationWhereInput {
  return { OR: [{ buyerId: userId }, { sellerId: userId }] };
}

interface ReadState {
  lastMessageAt: Date;
  buyerLastRead: Date | null;
  sellerLastRead: Date | null;
}

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

export function participantName(person: Participant): string {
  return person.status === "REMOVED" ? REMOVED_USER_NAME : (person.companyName ?? person.name);
}

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
