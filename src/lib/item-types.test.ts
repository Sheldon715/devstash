import { describe, expect, it } from "vitest";

import {
  getDashboardItemTypeKeys,
  getDashboardItemTypeRouteSegment,
  normalizeDashboardItemTypeKey,
  normalizeDashboardItemTypeRouteKey,
} from "@/lib/item-types";

describe("item-types", () => {
  it("returns the supported dashboard item type keys", () => {
    expect(getDashboardItemTypeKeys()).toEqual([
      "snippet",
      "prompt",
      "command",
      "note",
      "link",
      "file",
      "image",
    ]);
  });

  it("normalizes aliases and unknown values safely", () => {
    expect(normalizeDashboardItemTypeKey("url")).toBe("link");
    expect(normalizeDashboardItemTypeKey("note")).toBe("note");
    expect(normalizeDashboardItemTypeKey("unknown")).toBe("note");
  });

  it("maps route segments to item types", () => {
    expect(normalizeDashboardItemTypeRouteKey("Snippets")).toBe("snippet");
    expect(normalizeDashboardItemTypeRouteKey("urls")).toBe("link");
    expect(normalizeDashboardItemTypeRouteKey("other")).toBeNull();
  });

  it("builds plural route segments from type keys", () => {
    expect(getDashboardItemTypeRouteSegment("image")).toBe("images");
  });
});
