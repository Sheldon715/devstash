import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaItemFindManyMock } = vi.hoisted(() => ({
  prismaItemFindManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany: prismaItemFindManyMock,
    },
  },
}));

import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import {
  getDashboardSearchItems,
  getSearchPreview,
  mapCollectionsToDashboardSearchRecords,
} from "@/lib/db/search";

describe("dashboard search data", () => {
  beforeEach(() => {
    prismaItemFindManyMock.mockReset();
  });

  it("returns user-scoped item search records", async () => {
    prismaItemFindManyMock.mockResolvedValue([
      {
        id: "item-1",
        title: "Auth helper",
        description: null,
        content: "export function requireAuth() {}",
        url: null,
        fileName: null,
        type: {
          key: "snippet",
          name: "snippet",
        },
      },
      {
        id: "item-2",
        title: "Billing docs",
        description: "Stripe setup reference",
        content: null,
        url: "https://stripe.com/docs",
        fileName: null,
        type: {
          key: "url",
          name: "link",
        },
      },
    ]);

    await expect(getDashboardSearchItems("user-1")).resolves.toEqual([
      {
        id: "item-1",
        title: "Auth helper",
        typeKey: "snippet",
        typeLabel: "Snippet",
        contentPreview: "export function requireAuth() {}",
      },
      {
        id: "item-2",
        title: "Billing docs",
        typeKey: "link",
        typeLabel: "Link",
        contentPreview: "Stripe setup reference",
      },
    ]);
    expect(prismaItemFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
      },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      select: expect.objectContaining({
        content: true,
        description: true,
        fileName: true,
        title: true,
        url: true,
      }),
    });
  });

  it("maps dashboard collection cards to search records", () => {
    const collections: DashboardCollectionCardRecord[] = [
      {
        id: "collection-1",
        name: "Backend",
        description: "Server-side notes",
        descriptionValue: "Server-side notes",
        isFavorite: false,
        itemCount: 7,
        typeCount: 2,
        dominantTypeKey: "snippet",
        typeKeys: ["snippet", "command"],
        lastUpdatedAt: null,
      },
    ];

    expect(mapCollectionsToDashboardSearchRecords(collections)).toEqual([
      {
        id: "collection-1",
        name: "Backend",
        itemCount: 7,
      },
    ]);
  });

  it("normalizes and truncates search previews", () => {
    expect(getSearchPreview([null, " first\n\nvalue   wins ", "second"])).toBe(
      "first value wins",
    );
    expect(getSearchPreview(["a".repeat(200)])).toHaveLength(162);
    expect(getSearchPreview(["a".repeat(200)])).toMatch(/\.\.\.$/);
  });
});
