import type { Prisma } from "../../src/generated/prisma/client";
import { HIDDEN_ASSET_REASON } from "./assets";
import { daysAgo } from "./time";
import { AURORA_SUSPENSION_REASON } from "./users";

interface ThreadInput {
  id: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  initiatedBy: "BUYER" | "SELLER";
  messages: { from: "BUYER" | "SELLER"; body: string; at: Date }[];
  unread?: { buyer?: number; seller?: number };
}

interface SeedThread {
  conversation: Prisma.ConversationCreateManyInput;
  messages: Prisma.MessageCreateManyInput[];
}

function thread({ unread = {}, ...input }: ThreadInput): SeedThread {
  const times = input.messages.map((m) => m.at);
  const lastReadAt = (unreadCount = 0): Date | null => {
    const readUpTo = times.length - 1 - unreadCount;
    return readUpTo >= 0 ? times[readUpTo] : null;
  };
  return {
    conversation: {
      id: input.id,
      assetId: input.assetId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      initiatedBy: input.initiatedBy,
      buyerLastRead: lastReadAt(unread.buyer),
      sellerLastRead: lastReadAt(unread.seller),
      lastMessageAt: times[times.length - 1],
      createdAt: times[0],
    },
    messages: input.messages.map((m, i) => ({
      id: `${input.id}_msg_${i + 1}`,
      conversationId: input.id,
      senderId: m.from === "BUYER" ? input.buyerId : input.sellerId,
      body: m.body,
      createdAt: m.at,
    })),
  };
}

export const threads: SeedThread[] = [
  thread({
    id: "conv_demo_lt_emi",
    assetId: "ast_101",
    buyerId: "usr_buyer_demo",
    sellerId: "usr_seller_demo",
    initiatedBy: "BUYER",
    unread: { seller: 1 },
    messages: [
      { from: "BUYER", at: daysAgo(3, 6), body: "Hello, we are interested in the Lithuanian EMI. Could you share the safeguarding arrangements and the current monthly volume?" },
      { from: "SELLER", at: daysAgo(3, 2), body: "Thank you for reaching out. Safeguarding is with two Lithuanian banks; monthly volume is around €35M. Happy to send more details under NDA." },
      { from: "BUYER", at: daysAgo(2, 20), body: "That works for us. Would the MLRO stay for at least 12 months after closing?" },
      { from: "BUYER", at: daysAgo(1, 4), body: "Following up on the question above — could we also schedule a call this week?" },
    ],
  }),
  thread({
    id: "conv_demo_mt_emi",
    assetId: "ast_105",
    buyerId: "usr_buyer_demo",
    sellerId: "usr_seller_meridian",
    initiatedBy: "SELLER",
    unread: { buyer: 1 },
    messages: [
      { from: "SELLER", at: daysAgo(5, 9), body: "Hi James, your fund profile matches our Maltese EMI with the CASP authorisation. Would you like the teaser?" },
      { from: "BUYER", at: daysAgo(5, 1), body: "Yes, please send it over. Our ticket is up to €3M, so we would need to understand the price expectations." },
      { from: "SELLER", at: daysAgo(4, 18), body: "Understood. The seller is open to a structured deal with an earn-out. I can share the teaser here once you confirm." },
    ],
  }),
  thread({
    id: "conv_kumo_nl_emi",
    assetId: "ast_119",
    buyerId: "usr_buyer_kumo",
    sellerId: "usr_seller_nordlicht",
    initiatedBy: "BUYER",
    messages: [
      { from: "BUYER", at: daysAgo(6, 5), body: "We are looking for a European hub. Does the Dutch EMI have existing scheme memberships?" },
      { from: "SELLER", at: daysAgo(6, 1), body: "It has iDEAL and Bancontact acquiring and is an associate member of Mastercard." },
      { from: "BUYER", at: daysAgo(5, 22), body: "Great, we would like to proceed to a first call." },
    ],
  }),
  thread({
    id: "conv_alpenrose_de_bank",
    assetId: "ast_117",
    buyerId: "usr_buyer_alpenrose",
    sellerId: "usr_seller_nordlicht",
    initiatedBy: "BUYER",
    messages: [
      { from: "BUYER", at: daysAgo(12, 7), body: "Could you share the latest capital ratios and the composition of the deposit base?" },
      { from: "SELLER", at: daysAgo(11, 23), body: "CET1 ratio is 18.4%. Deposits are 70% private clients and 30% corporate. Full figures follow the NDA." },
    ],
  }),
  thread({
    id: "conv_lowlands_lt_casp",
    assetId: "ast_127",
    buyerId: "usr_buyer_lowlands",
    sellerId: "usr_seller_aurora",
    initiatedBy: "BUYER",
    messages: [
      { from: "BUYER", at: daysAgo(8, 3), body: "Is the CASP authorisation transferable with the exchange platform, or can it be acquired on its own?" },
      { from: "SELLER", at: daysAgo(7, 21), body: "Both options are possible. The licence-only structure would be priced lower." },
    ],
  }),
  thread({
    id: "conv_maple_ca_msb",
    assetId: "ast_114",
    buyerId: "usr_buyer_maple",
    sellerId: "usr_seller_thames",
    initiatedBy: "SELLER",
    messages: [
      { from: "SELLER", at: daysAgo(9, 4), body: "Hi Ethan, we have a FINTRAC-registered MSB with virtual currency dealing that fits your profile." },
      { from: "BUYER", at: daysAgo(8, 22), body: "Interesting. How long does the change of control usually take with FINTRAC?" },
    ],
  }),
];

export const moderationLogs: Prisma.ModerationLogCreateManyInput[] = [
  {
    id: "mod_1",
    managerId: "usr_manager_demo",
    action: "SUSPEND_USER",
    targetUserId: "usr_buyer_danube",
    reason: "Profile listed a ticket size inconsistent with the submitted proof of funds.",
    createdAt: daysAgo(20),
  },
  {
    id: "mod_2",
    managerId: "usr_manager_demo",
    action: "REINSTATE_USER",
    targetUserId: "usr_buyer_danube",
    reason: "Proof of funds verified on a call; the profile has been corrected.",
    createdAt: daysAgo(18),
  },
  {
    id: "mod_3",
    managerId: "usr_manager_compliance",
    action: "SUSPEND_USER",
    targetUserId: "usr_seller_aurora",
    reason: AURORA_SUSPENSION_REASON,
    createdAt: daysAgo(6),
  },
  {
    id: "mod_4",
    managerId: "usr_manager_demo",
    action: "HIDE_ASSET",
    targetAssetId: "ast_113",
    reason: HIDDEN_ASSET_REASON,
    createdAt: daysAgo(3),
  },
];
