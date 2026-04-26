import { describe, expect, it } from "vitest";

import {
  getPaginationOffset,
  getPaginationState,
  normalizePage,
} from "@/lib/pagination";

describe("pagination helpers", () => {
  it("normalizes missing, invalid, and fractional page values", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("abc")).toBe(1);
    expect(normalizePage("-3")).toBe(1);
    expect(normalizePage("2.9")).toBe(2);
    expect(normalizePage(["4", "5"])).toBe(4);
  });

  it("calculates offsets from normalized page values", () => {
    expect(getPaginationOffset(1, 21)).toBe(0);
    expect(getPaginationOffset(3, 21)).toBe(42);
    expect(getPaginationOffset(-10, 21)).toBe(0);
  });

  it("builds page state and clamps pages beyond the result set", () => {
    expect(getPaginationState(44, 99, 21)).toEqual({
      currentPage: 3,
      hasNextPage: false,
      hasPreviousPage: true,
      pageSize: 21,
      totalItems: 44,
      totalPages: 3,
    });
  });
});
