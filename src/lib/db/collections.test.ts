import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaCollectionCreateMock, prismaCollectionItemFindManyMock } = vi.hoisted(() => ({
  prismaCollectionCreateMock: vi.fn(),
  prismaCollectionItemFindManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: prismaCollectionCreateMock,
    },
    collectionItem: {
      findMany: prismaCollectionItemFindManyMock,
    },
  },
}));

import {
  createDashboardCollection,
  getDashboardCollectionItems,
} from "@/lib/db/collections";

describe("collection db queries", () => {
  beforeEach(() => {
    prismaCollectionCreateMock.mockReset();
    prismaCollectionItemFindManyMock.mockReset();
  });

  it("creates a user-scoped collection and maps dashboard card data", async () => {
    const updatedAt = new Date("2026-04-25T02:15:00.000Z");

    prismaCollectionCreateMock.mockResolvedValue({
      id: "collection-1",
      name: "React Patterns",
      description: "Reusable React implementation notes.",
      isFavorite: false,
      updatedAt,
    });

    await expect(
      createDashboardCollection("user-1", {
        name: "React Patterns",
        description: "Reusable React implementation notes.",
      }),
    ).resolves.toEqual({
      id: "collection-1",
      name: "React Patterns",
      description: "Reusable React implementation notes.",
      isFavorite: false,
      itemCount: 0,
      typeCount: 0,
      dominantTypeKey: null,
      typeKeys: [],
      lastUpdatedAt: updatedAt,
    });

    expect(prismaCollectionCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "React Patterns",
        description: "Reusable React implementation notes.",
      },
      select: {
        id: true,
        name: true,
        description: true,
        isFavorite: true,
        updatedAt: true,
      },
    });
  });

  it("uses the dashboard empty-description fallback for new collections", async () => {
    const updatedAt = new Date("2026-04-25T02:15:00.000Z");

    prismaCollectionCreateMock.mockResolvedValue({
      id: "collection-2",
      name: "Loose Ideas",
      description: null,
      isFavorite: false,
      updatedAt,
    });

    await expect(
      createDashboardCollection("user-1", {
        name: "Loose Ideas",
        description: null,
      }),
    ).resolves.toMatchObject({
      description: "No description yet.",
      itemCount: 0,
      typeCount: 0,
      typeKeys: [],
    });
  });

  it("returns user-scoped items for a collection", async () => {
    const createdAt = new Date("2026-04-24T10:00:00.000Z");
    const updatedAt = new Date("2026-04-25T12:00:00.000Z");

    prismaCollectionItemFindManyMock.mockResolvedValue([
      {
        item: {
          id: "item-1",
          title: "Auth Snippet",
          description: null,
          fileName: null,
          fileMimeType: null,
          fileSizeBytes: null,
          isPinned: true,
          isFavorite: false,
          createdAt,
          updatedAt,
          type: {
            key: "snippet",
            name: "snippet",
          },
          tags: [
            {
              tag: {
                name: "auth",
              },
            },
          ],
          collections: [
            {
              collection: {
                name: "React Patterns",
              },
            },
          ],
        },
      },
    ]);

    await expect(getDashboardCollectionItems("user-1", "collection-1")).resolves.toEqual([
      {
        id: "item-1",
        title: "Auth Snippet",
        description: "No description yet.",
        typeKey: "snippet",
        typeLabel: "Snippet",
        collectionNames: ["React Patterns"],
        tags: ["auth"],
        fileName: null,
        fileMimeType: null,
        fileSizeBytes: null,
        isPinned: true,
        isFavorite: false,
        createdAt,
        updatedAt,
      },
    ]);

    expect(prismaCollectionItemFindManyMock).toHaveBeenCalledWith({
      where: {
        collectionId: "collection-1",
        collection: {
          userId: "user-1",
        },
        item: {
          userId: "user-1",
        },
      },
      orderBy: [{ sortOrder: "asc" }, { addedAt: "asc" }],
      select: {
        item: {
          select: {
            id: true,
            title: true,
            description: true,
            fileName: true,
            fileMimeType: true,
            fileSizeBytes: true,
            isPinned: true,
            isFavorite: true,
            createdAt: true,
            updatedAt: true,
            type: {
              select: {
                key: true,
                name: true,
              },
            },
            tags: {
              select: {
                tag: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            collections: {
              select: {
                collection: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});
