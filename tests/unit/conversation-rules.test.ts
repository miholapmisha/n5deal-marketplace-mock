import { describe, expect, it } from "vitest";

import {
  conversationSide,
  hasUnread,
  otherSide,
  participantName,
  REMOVED_USER_NAME,
  sendBlockedReason,
} from "@/server/policies/conversation-rules";

const conversation = { buyerId: "buyer_1", sellerId: "seller_1" };

describe("conversationSide", () => {
  it("finds the user's side, or null for outsiders", () => {
    expect(conversationSide(conversation, "buyer_1")).toBe("BUYER");
    expect(conversationSide(conversation, "seller_1")).toBe("SELLER");
    expect(conversationSide(conversation, "someone_else")).toBeNull();
    expect(otherSide("BUYER")).toBe("SELLER");
  });
});

describe("hasUnread", () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 9, 1, 12, minute));

  it("is unread when never read or when a message arrived after the last read", () => {
    const thread = { lastMessageAt: at(10), buyerLastRead: null, sellerLastRead: at(10) };
    expect(hasUnread(thread, "BUYER")).toBe(true);
    expect(hasUnread(thread, "SELLER")).toBe(false);
    expect(hasUnread({ ...thread, sellerLastRead: at(5) }, "SELLER")).toBe(true);
  });
});

describe("participantName", () => {
  it("prefers the company and never names a removed user", () => {
    expect(participantName({ name: "Ann", companyName: "Acme", status: "ACTIVE" })).toBe("Acme");
    expect(participantName({ name: "Ann", companyName: null, status: "SUSPENDED" })).toBe("Ann");
    expect(participantName({ name: "Ann", companyName: "Acme", status: "REMOVED" })).toBe(REMOVED_USER_NAME);
  });
});

describe("sendBlockedReason", () => {
  it("allows writing to an active counterpart", () => {
    expect(sendBlockedReason({ status: "ACTIVE" }, "SELLER")).toBeNull();
  });

  it("explains a suspended or removed counterpart", () => {
    expect(sendBlockedReason({ status: "SUSPENDED" }, "SELLER")).toMatch(/seller's account is suspended/);
    expect(sendBlockedReason({ status: "REMOVED" }, "BUYER")).toMatch(/buyer has been removed/);
  });
});
