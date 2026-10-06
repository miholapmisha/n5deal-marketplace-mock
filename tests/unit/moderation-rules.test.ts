import { describe, expect, it } from "vitest";

import {
  ASSET_TRANSITIONS,
  assetActionsFor,
  removalConfirmation,
  USER_TRANSITIONS,
  userActionsFor,
  userModerationBlock,
} from "@/server/policies/moderation-rules";

// SPEC §4.3 — who a manager may act on, and which status each action starts from.

const manager = { id: "manager_1" };

describe("userModerationBlock", () => {
  it("refuses a manager acting on their own account", () => {
    expect(userModerationBlock(manager, { id: "manager_1", role: "MANAGER" })).toMatch(/your own account/);
  });

  it("refuses acting on another manager", () => {
    expect(userModerationBlock(manager, { id: "manager_2", role: "MANAGER" })).toMatch(/cannot be moderated/);
  });

  it("allows acting on buyers and sellers", () => {
    expect(userModerationBlock(manager, { id: "buyer_1", role: "BUYER" })).toBeNull();
    expect(userModerationBlock(manager, { id: "seller_1", role: "SELLER" })).toBeNull();
  });
});

describe("user transitions", () => {
  it("offers the actions each status allows, in button order", () => {
    expect(userActionsFor("ACTIVE")).toEqual(["SUSPEND_USER", "REMOVE_USER"]);
    expect(userActionsFor("SUSPENDED")).toEqual(["REINSTATE_USER", "REMOVE_USER"]);
    expect(userActionsFor("REMOVED")).toEqual([]);
  });

  it("leads to the documented statuses", () => {
    expect(USER_TRANSITIONS.SUSPEND_USER.to).toBe("SUSPENDED");
    expect(USER_TRANSITIONS.REINSTATE_USER.to).toBe("ACTIVE");
    expect(USER_TRANSITIONS.REMOVE_USER.to).toBe("REMOVED");
  });
});

describe("asset transitions", () => {
  it("offers the actions each status allows, in button order", () => {
    expect(assetActionsFor("DRAFT")).toEqual(["REMOVE_ASSET"]);
    expect(assetActionsFor("PUBLISHED")).toEqual(["HIDE_ASSET", "REMOVE_ASSET"]);
    expect(assetActionsFor("HIDDEN")).toEqual(["UNHIDE_ASSET", "REMOVE_ASSET"]);
    expect(assetActionsFor("REMOVED")).toEqual([]);
  });

  it("leads to the documented statuses", () => {
    expect(ASSET_TRANSITIONS.HIDE_ASSET.to).toBe("HIDDEN");
    expect(ASSET_TRANSITIONS.UNHIDE_ASSET.to).toBe("PUBLISHED");
    expect(ASSET_TRANSITIONS.REMOVE_ASSET.to).toBe("REMOVED");
  });
});

describe("removalConfirmation", () => {
  it("is the company name, or the person's name when there is none", () => {
    expect(removalConfirmation({ name: "Ann Lee", companyName: " Acme Capital " })).toBe("Acme Capital");
    expect(removalConfirmation({ name: "Ann Lee", companyName: null })).toBe("Ann Lee");
  });
});
