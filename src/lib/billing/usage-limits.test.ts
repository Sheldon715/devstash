import { describe, expect, it } from "vitest";

import {
  canCreateCollection,
  canCreateItem,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  isProPlan,
} from "@/lib/billing/usage-limits";

describe("billing usage limits", () => {
  it("allows Free users to create an item below the free limit", () => {
    expect(canCreateItem("FREE", FREE_ITEM_LIMIT - 1)).toEqual({
      allowed: true,
      message: null,
    });
  });

  it("blocks Free users at the free item limit", () => {
    expect(canCreateItem("FREE", FREE_ITEM_LIMIT)).toEqual({
      allowed: false,
      message: "Free workspaces can save up to 50 items. Upgrade to Pro to save more.",
    });
  });

  it("allows Pro users to create items beyond the free limit", () => {
    expect(canCreateItem("PRO", FREE_ITEM_LIMIT + 25)).toEqual({
      allowed: true,
      message: null,
    });
  });

  it("allows Free users to create a collection below the free limit", () => {
    expect(canCreateCollection("FREE", FREE_COLLECTION_LIMIT - 1)).toEqual({
      allowed: true,
      message: null,
    });
  });

  it("blocks Free users at the free collection limit", () => {
    expect(canCreateCollection("FREE", FREE_COLLECTION_LIMIT)).toEqual({
      allowed: false,
      message: "Free workspaces can create up to 3 collections. Upgrade to Pro to create more.",
    });
  });

  it("allows Pro users to create collections beyond the free limit", () => {
    expect(canCreateCollection("PRO", FREE_COLLECTION_LIMIT + 10)).toEqual({
      allowed: true,
      message: null,
    });
  });

  it("treats missing or unknown plans as Free", () => {
    expect(isProPlan(null)).toBe(false);
    expect(isProPlan(undefined)).toBe(false);
    expect(isProPlan("TEAM")).toBe(false);
    expect(canCreateItem(undefined, FREE_ITEM_LIMIT).allowed).toBe(false);
    expect(canCreateCollection("TEAM", FREE_COLLECTION_LIMIT).allowed).toBe(false);
  });
});
