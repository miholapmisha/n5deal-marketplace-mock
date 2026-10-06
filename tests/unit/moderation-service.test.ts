import { beforeEach, describe, expect, it, vi } from "vitest";

import { type CurrentUser, getCurrentUser } from "@/server/auth/session";
import {
  changeAssetStatus,
  changeUserStatus,
  findAssetForModeration,
  findUserForModeration,
  removeUser,
} from "@/server/moderation/moderation.repo";
import { moderateAsset, moderateUser } from "@/server/moderation/moderation.service";

// SPEC §4.3, §9: the service is where moderation rules cannot be skipped. The repo and the
// session are mocked, so these tests check decisions, not SQL.

vi.mock("@/server/auth/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/moderation/moderation.repo", () => ({
  findUserForModeration: vi.fn(),
  findAssetForModeration: vi.fn(),
  changeUserStatus: vi.fn(),
  removeUser: vi.fn(),
  changeAssetStatus: vi.fn(),
}));

const manager: CurrentUser = {
  id: "usr_manager",
  name: "Anna Lindqvist",
  email: "manager@demo.n5deal",
  companyName: "N5Deal",
  role: "MANAGER",
};

const seller = { id: "usr_seller", role: "SELLER", status: "ACTIVE", name: "Elena", companyName: "Baltic Fintech" } as const;
const reason = "Ownership documents could not be verified.";

beforeEach(() => {
  vi.mocked(getCurrentUser).mockResolvedValue(manager);
  vi.mocked(findUserForModeration).mockResolvedValue(seller);
  vi.mocked(changeUserStatus).mockResolvedValue(true);
  vi.mocked(removeUser).mockResolvedValue(true);
  vi.mocked(changeAssetStatus).mockResolvedValue(true);
});

describe("moderateUser", () => {
  it("suspends an active seller, conditional on the status it saw", async () => {
    await expect(moderateUser({ userId: seller.id, action: "SUSPEND_USER", reason })).resolves.toEqual({ ok: true });
    expect(changeUserStatus).toHaveBeenCalledWith({
      managerId: manager.id,
      userId: seller.id,
      expected: "ACTIVE",
      next: "SUSPENDED",
      action: "SUSPEND_USER",
      reason,
    });
  });

  it("refuses anyone who is not a manager", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...manager, id: "usr_seller_2", role: "SELLER" });
    const result = await moderateUser({ userId: seller.id, action: "SUSPEND_USER", reason });
    expect(result).toEqual({ ok: false, error: "Only platform managers can moderate." });
    expect(changeUserStatus).not.toHaveBeenCalled();
  });

  it("refuses a logged-out caller", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const result = await moderateUser({ userId: seller.id, action: "SUSPEND_USER", reason });
    expect(result.ok).toBe(false);
    expect(changeUserStatus).not.toHaveBeenCalled();
  });

  it("refuses to act on another manager or on yourself", async () => {
    vi.mocked(findUserForModeration).mockResolvedValue({ ...seller, id: "usr_manager_2", role: "MANAGER" });
    expect(await moderateUser({ userId: "usr_manager_2", action: "SUSPEND_USER", reason })).toMatchObject({ ok: false });

    vi.mocked(findUserForModeration).mockResolvedValue({ ...seller, id: manager.id, role: "MANAGER" });
    expect(await moderateUser({ userId: manager.id, action: "SUSPEND_USER", reason })).toMatchObject({ ok: false });

    expect(changeUserStatus).not.toHaveBeenCalled();
  });

  it("refuses a transition the current status does not allow", async () => {
    vi.mocked(findUserForModeration).mockResolvedValue({ ...seller, status: "SUSPENDED" });
    const result = await moderateUser({ userId: seller.id, action: "SUSPEND_USER", reason });
    expect(result).toEqual({ ok: false, error: "Only active accounts can be suspended." });
  });

  it("reports a change made in the meantime", async () => {
    vi.mocked(changeUserStatus).mockResolvedValue(false);
    const result = await moderateUser({ userId: seller.id, action: "SUSPEND_USER", reason });
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/changed in the meantime/) });
  });

  it("removes an account only when the company name is typed exactly", async () => {
    const wrong = await moderateUser({ userId: seller.id, action: "REMOVE_USER", reason, confirmation: "Baltic" });
    expect(wrong).toMatchObject({ ok: false, field: "confirmation" });
    expect(removeUser).not.toHaveBeenCalled();

    const right = await moderateUser({ userId: seller.id, action: "REMOVE_USER", reason, confirmation: "Baltic Fintech" });
    expect(right).toEqual({ ok: true });
    expect(removeUser).toHaveBeenCalledWith({ managerId: manager.id, userId: seller.id, expected: "ACTIVE", reason });
  });
});

describe("moderateAsset", () => {
  const publishedAt = new Date("2026-09-01T00:00:00Z");

  it("hides a published asset with the reason", async () => {
    vi.mocked(findAssetForModeration).mockResolvedValue({ id: "ast_1", slug: "a", status: "PUBLISHED", publishedAt });
    expect(await moderateAsset({ assetId: "ast_1", action: "HIDE_ASSET", reason })).toEqual({ ok: true });
    expect(changeAssetStatus).toHaveBeenCalledWith(
      expect.objectContaining({ expected: "PUBLISHED", data: { status: "HIDDEN", statusReason: reason } }),
    );
  });

  it("unhides with the original publish date and no reason", async () => {
    vi.mocked(findAssetForModeration).mockResolvedValue({ id: "ast_1", slug: "a", status: "HIDDEN", publishedAt });
    expect(await moderateAsset({ assetId: "ast_1", action: "UNHIDE_ASSET", reason })).toEqual({ ok: true });
    expect(changeAssetStatus).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PUBLISHED", statusReason: null, publishedAt } }),
    );
  });

  it("refuses to hide an asset that is not published", async () => {
    vi.mocked(findAssetForModeration).mockResolvedValue({ id: "ast_1", slug: "a", status: "DRAFT", publishedAt: null });
    expect(await moderateAsset({ assetId: "ast_1", action: "HIDE_ASSET", reason })).toEqual({
      ok: false,
      error: "Only published assets can be hidden.",
    });
    expect(changeAssetStatus).not.toHaveBeenCalled();
  });
});
