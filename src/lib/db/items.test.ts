import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaItemFindFirstMock } = vi.hoisted(() => ({
  prismaItemFindFirstMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: prismaItemFindFirstMock,
    },
    itemType: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { getDashboardItemDetail } from "@/lib/db/items";

describe("item db queries", () => {
  beforeEach(() => {
    prismaItemFindFirstMock.mockReset();
  });

  it("returns null when the requested item does not exist", async () => {
    prismaItemFindFirstMock.mockResolvedValue(null);

    await expect(getDashboardItemDetail("user-1", "item-1")).resolves.toBeNull();
  });

  it("maps item detail data for the drawer view", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-23T09:45:00.000Z");
    const lastAccessedAt = new Date("2026-04-23T10:15:00.000Z");

    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
      title: "Reusable auth helpers",
      description: null,
      contentMode: "TEXT",
      content: "export function requireAuth() {}",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "typescript",
      aiSummary: "Utilities for guarding authenticated requests.",
      isPinned: true,
      isFavorite: true,
      createdAt,
      updatedAt,
      lastAccessedAt,
      type: {
        key: "url",
        name: "link",
      },
      tags: [
        {
          tag: {
            color: "#61dafb",
            name: "react",
          },
        },
        {
          tag: {
            color: null,
            name: "auth",
          },
        },
        {
          tag: {
            color: "#61dafb",
            name: "react",
          },
        },
      ],
      collections: [
        {
          collection: {
            name: "Backend",
          },
        },
        {
          collection: {
            name: "Snippets",
          },
        },
        {
          collection: {
            name: "Backend",
          },
        },
      ],
    });

    await expect(getDashboardItemDetail("user-1", "item-1")).resolves.toEqual({
      id: "item-1",
      title: "Reusable auth helpers",
      description: "No description yet.",
      contentMode: "TEXT",
      content: "export function requireAuth() {}",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "typescript",
      aiSummary: "Utilities for guarding authenticated requests.",
      collectionNames: ["Backend", "Snippets"],
      tags: [
        {
          color: null,
          name: "auth",
        },
        {
          color: "#61dafb",
          name: "react",
        },
      ],
      isPinned: true,
      isFavorite: true,
      typeKey: "link",
      typeLabel: "Link",
      createdAt,
      updatedAt,
      lastAccessedAt,
    });
  });
});
