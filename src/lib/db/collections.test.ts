import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaCollectionCreateMock,
  prismaCollectionDeleteManyMock,
  prismaCollectionFindFirstMock,
  prismaCollectionItemCountMock,
  prismaCollectionItemFindManyMock,
  prismaCollectionUpdateManyMock,
} = vi.hoisted(() => ({
  prismaCollectionCreateMock: vi.fn(),
  prismaCollectionDeleteManyMock: vi.fn(),
  prismaCollectionFindFirstMock: vi.fn(),
  prismaCollectionItemCountMock: vi.fn(),
  prismaCollectionItemFindManyMock: vi.fn(),
  prismaCollectionUpdateManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: prismaCollectionCreateMock,
      deleteMany: prismaCollectionDeleteManyMock,
      findFirst: prismaCollectionFindFirstMock,
      updateMany: prismaCollectionUpdateManyMock,
    },
    collectionItem: {
      count: prismaCollectionItemCountMock,
      findMany: prismaCollectionItemFindManyMock,
    },
  },
}));

import {
  createDashboardCollection,
  deleteDashboardCollection,
  getDashboardCollectionItems,
  getDashboardCollectionItemsPage,
  updateDashboardCollection,
} from "@/lib/db/collections";

describe("collection db queries", () => {
  beforeEach(() => {
    prismaCollectionCreateMock.mockReset();
    prismaCollectionDeleteManyMock.mockReset();
    prismaCollectionFindFirstMock.mockReset();
    prismaCollectionItemCountMock.mockReset();
    prismaCollectionItemFindManyMock.mockReset();
    prismaCollectionUpdateManyMock.mockReset();
  });

  it("creates a user-scoped collection and maps dashboard card data", async () => {
    const updatedAt = new Date("2026-04-25T02:15:00.000Z");

    prismaCollectionCreateMock.mockResolvedValue({
      id: "collection-1",
      name: "React Patterns",
      description: "Reusable React implementation notes.",
      descriptionValue: "Reusable React implementation notes.",
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
      descriptionValue: "Reusable React implementation notes.",
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
      descriptionValue: null,
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
      skip: undefined,
      take: undefined,
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

  it("returns a paginated collection item page", async () => {
    prismaCollectionItemCountMock.mockResolvedValue(44);
    prismaCollectionItemFindManyMock.mockResolvedValue([]);

    await expect(
      getDashboardCollectionItemsPage("user-1", "collection-1", { page: 3 }),
    ).resolves.toEqual({
      items: [],
      pagination: {
        currentPage: 3,
        hasNextPage: false,
        hasPreviousPage: true,
        pageSize: 21,
        totalItems: 44,
        totalPages: 3,
      },
    });

    const where = {
      collectionId: "collection-1",
      collection: {
        userId: "user-1",
      },
      item: {
        userId: "user-1",
      },
    };

    expect(prismaCollectionItemCountMock).toHaveBeenCalledWith({ where });
    expect(prismaCollectionItemFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 42,
        take: 21,
        where,
      }),
    );
  });

  it("updates collection metadata within the signed-in user's scope", async () => {
    const updatedAt = new Date("2026-04-25T04:30:00.000Z");

    prismaCollectionUpdateManyMock.mockResolvedValue({
      count: 1,
    });
    prismaCollectionFindFirstMock.mockResolvedValue({
      id: "collection-1",
      name: "React Recipes",
      description: "Updated patterns.",
      isFavorite: false,
      updatedAt,
    });

    await expect(
      updateDashboardCollection("user-1", "collection-1", {
        name: "React Recipes",
        description: "Updated patterns.",
      }),
    ).resolves.toEqual({
      id: "collection-1",
      name: "React Recipes",
      description: "Updated patterns.",
      isFavorite: false,
      updatedAt,
    });

    expect(prismaCollectionUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
        userId: "user-1",
      },
      data: {
        name: "React Recipes",
        description: "Updated patterns.",
      },
    });
    expect(prismaCollectionFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
        userId: "user-1",
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

  it("returns null when updating a collection outside the signed-in user's scope", async () => {
    prismaCollectionUpdateManyMock.mockResolvedValue({
      count: 0,
    });

    await expect(
      updateDashboardCollection("user-1", "collection-2", {
        name: "Private",
        description: null,
      }),
    ).resolves.toBeNull();

    expect(prismaCollectionFindFirstMock).not.toHaveBeenCalled();
  });

  it("deletes only the user-scoped collection record", async () => {
    prismaCollectionDeleteManyMock.mockResolvedValue({
      count: 1,
    });

    await expect(deleteDashboardCollection("user-1", "collection-1")).resolves.toBe(true);

    expect(prismaCollectionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
        userId: "user-1",
      },
    });
  });

  it("returns false when deleting a collection outside the signed-in user's scope", async () => {
    prismaCollectionDeleteManyMock.mockResolvedValue({
      count: 0,
    });

    await expect(deleteDashboardCollection("user-1", "collection-2")).resolves.toBe(false);
  });
});
