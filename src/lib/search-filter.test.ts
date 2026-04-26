import { describe, expect, it } from "vitest";

import { filterGlobalSearchResult } from "@/lib/search-filter";

describe("global search filter", () => {
  it("matches complete query tokens against searchable keywords", () => {
    expect(
      filterGlobalSearchResult("item-1", "test", [
        "Testing auth flows",
        "Snippet",
        "Password reset coverage",
      ]),
    ).toBeGreaterThan(0);
  });

  it("does not fuzzy-match loose character sequences", () => {
    expect(
      filterGlobalSearchResult("item-1", "test", [
        "Terminal setup",
        "Command",
        "Start the server",
      ]),
    ).toBe(0);
  });

  it("requires every query token to match", () => {
    expect(
      filterGlobalSearchResult("collection-1", "auth test", [
        "Auth helpers",
        "12",
      ]),
    ).toBe(0);
    expect(
      filterGlobalSearchResult("collection-1", "auth help", [
        "Auth helpers",
        "12",
      ]),
    ).toBeGreaterThan(0);
  });

  it("does not match IDs when keywords are provided", () => {
    expect(filterGlobalSearchResult("item-test-id", "test", ["Auth helper"])).toBe(0);
  });
});
