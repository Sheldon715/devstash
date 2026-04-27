import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteR2ObjectMock,
  prismaItemCreateMock,
  prismaItemCountMock,
  prismaItemDeleteMock,
  prismaItemFindManyMock,
  prismaItemFindFirstMock,
  prismaItemTypeFindFirstMock,
  prismaItemUpdateMock,
  prismaCollectionFindManyMock,
} = vi.hoisted(() => ({
  deleteR2ObjectMock: vi.fn(),
  prismaItemCreateMock: vi.fn(),
  prismaItemCountMock: vi.fn(),
  prismaItemDeleteMock: vi.fn(),
  prismaItemFindManyMock: vi.fn(),
  prismaItemFindFirstMock: vi.fn(),
  prismaItemTypeFindFirstMock: vi.fn(),
  prismaItemUpdateMock: vi.fn(),
  prismaCollectionFindManyMock: vi.fn(),
}));

vi.mock("@/lib/storage/r2", () => ({
  deleteR2Object: deleteR2ObjectMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      count: prismaItemCountMock,
      create: prismaItemCreateMock,
      delete: prismaItemDeleteMock,
      findMany: prismaItemFindManyMock,
      findFirst: prismaItemFindFirstMock,
      update: prismaItemUpdateMock,
    },
    itemType: {
      findMany: vi.fn(),
      findFirst: prismaItemTypeFindFirstMock,
    },
    collection: {
      findMany: prismaCollectionFindManyMock,
    },
  },
}));

import {
  createItem,
  deleteItem,
  getDashboardItemDetail,
  getDashboardItemTypePage,
  getFavoriteDashboardItems,
  isItemFileKeyInUse,
  toggleItemFavorite,
  updateItem,
} from "@/lib/db/items";

describe("item db queries", () => {
  beforeEach(() => {
    prismaItemCreateMock.mockReset();
    prismaItemCountMock.mockReset();
    prismaItemDeleteMock.mockReset();
    prismaItemFindManyMock.mockReset();
    prismaItemFindFirstMock.mockReset();
    prismaItemTypeFindFirstMock.mockReset();
    prismaItemUpdateMock.mockReset();
    prismaCollectionFindManyMock.mockReset();
    deleteR2ObjectMock.mockReset();
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
            id: "collection-backend",
            name: "Backend",
          },
        },
        {
          collection: {
            id: "collection-snippets",
            name: "Snippets",
          },
        },
        {
          collection: {
            id: "collection-backend",
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
      collectionIds: ["collection-backend", "collection-snippets"],
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

  it("maps file metadata for the item type page list", async () => {
    const createdAt = new Date("2026-04-20T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemTypeFindFirstMock.mockResolvedValue({
      key: "file",
      name: "file",
      icon: "paperclip",
    });
    prismaItemCountMock.mockResolvedValue(1);
    prismaItemFindManyMock.mockResolvedValue([
      {
        id: "item-1",
        title: "Architecture notes",
        description: null,
        fileName: "architecture.pdf",
        fileMimeType: "application/pdf",
        fileSizeBytes: 2048,
        isPinned: false,
        isFavorite: true,
        createdAt,
        updatedAt,
        type: {
          key: "file",
          name: "file",
        },
        tags: [
          {
            tag: {
              name: "docs",
            },
          },
        ],
        collections: [
          {
            collection: {
              name: "Planning",
            },
          },
        ],
      },
    ]);

    await expect(getDashboardItemTypePage("user-1", "files")).resolves.toEqual({
      itemType: {
        key: "file",
        name: "File",
        icon: "paperclip",
        totalItems: 1,
        typeKey: "file",
      },
      items: [
        {
          id: "item-1",
          title: "Architecture notes",
          description: "No description yet.",
          typeKey: "file",
          typeLabel: "File",
          collectionNames: ["Planning"],
          tags: ["docs"],
          fileName: "architecture.pdf",
          fileMimeType: "application/pdf",
          fileSizeBytes: 2048,
          isPinned: false,
          isFavorite: true,
          createdAt,
          updatedAt,
        },
      ],
      pagination: {
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        pageSize: 21,
        totalItems: 1,
        totalPages: 1,
      },
    });

    expect(prismaItemCountMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        type: {
          key: "file",
        },
      },
    });
    expect(prismaItemFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 21,
        where: {
          userId: "user-1",
          type: {
            key: "file",
          },
        },
        select: expect.objectContaining({
          createdAt: true,
          fileMimeType: true,
          fileSizeBytes: true,
        }),
      }),
    );
  });

  it("returns favorite items ordered by latest update", async () => {
    const createdAt = new Date("2026-04-20T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemFindManyMock.mockResolvedValue([
      {
        id: "item-1",
        title: "Favorite command",
        description: null,
        fileName: null,
        fileMimeType: null,
        fileSizeBytes: null,
        isPinned: false,
        isFavorite: true,
        createdAt,
        updatedAt,
        type: {
          key: "command",
          name: "command",
        },
        tags: [],
        collections: [],
      },
    ]);

    await expect(getFavoriteDashboardItems("user-1")).resolves.toEqual([
      {
        id: "item-1",
        title: "Favorite command",
        description: "No description yet.",
        typeKey: "command",
        typeLabel: "Command",
        collectionNames: [],
        tags: [],
        fileName: null,
        fileMimeType: null,
        fileSizeBytes: null,
        isPinned: false,
        isFavorite: true,
        createdAt,
        updatedAt,
      },
    ]);

    expect(prismaItemFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
        where: {
          userId: "user-1",
          isFavorite: true,
        },
      }),
    );
  });

  it("uses page offsets for item type pages", async () => {
    prismaItemTypeFindFirstMock.mockResolvedValue({
      key: "note",
      name: "note",
      icon: "file-text",
    });
    prismaItemCountMock.mockResolvedValue(42);
    prismaItemFindManyMock.mockResolvedValue([]);

    await expect(getDashboardItemTypePage("user-1", "notes", { page: 2 })).resolves.toMatchObject({
      itemType: {
        totalItems: 42,
      },
      pagination: {
        currentPage: 2,
        hasNextPage: false,
        hasPreviousPage: true,
        pageSize: 21,
        totalItems: 42,
        totalPages: 2,
      },
    });

    expect(prismaItemFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 21,
        take: 21,
      }),
    );
  });

  it("returns null when creating an item with an unknown type", async () => {
    prismaItemTypeFindFirstMock.mockResolvedValue(null);

    await expect(
      createItem("user-1", {
        typeKey: "note",
        title: "Loose note",
        description: null,
        content: null,
        file: null,
        url: null,
        language: null,
        tags: [],
        collectionIds: [],
      }),
    ).resolves.toBeNull();

    expect(prismaItemCreateMock).not.toHaveBeenCalled();
  });

  it("creates an item with system type ownership and tags", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemTypeFindFirstMock.mockResolvedValue({
      id: "type-command",
      contentMode: "TEXT",
    });
    prismaItemCreateMock.mockResolvedValue({
      id: "item-1",
      title: "Build command",
      description: "Runs the production build.",
      contentMode: "TEXT",
      content: "npm run build",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "shell",
      aiSummary: null,
      isPinned: false,
      isFavorite: false,
      createdAt,
      updatedAt,
      lastAccessedAt: null,
      type: {
        key: "command",
        name: "command",
      },
      tags: [
        {
          tag: {
            color: null,
            name: "cli",
          },
        },
      ],
      collections: [],
    });

    await expect(
      createItem("user-1", {
        typeKey: "command",
        title: "Build command",
        description: "Runs the production build.",
        content: "npm run build",
        file: null,
        url: null,
        language: "shell",
        tags: ["cli", "cli"],
        collectionIds: [],
      }),
    ).resolves.toEqual({
      id: "item-1",
      title: "Build command",
      description: "Runs the production build.",
      contentMode: "TEXT",
      content: "npm run build",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "shell",
      aiSummary: null,
      collectionIds: [],
      collectionNames: [],
      tags: [
        {
          color: null,
          name: "cli",
        },
      ],
      isPinned: false,
      isFavorite: false,
      typeKey: "command",
      typeLabel: "Command",
      createdAt,
      updatedAt,
      lastAccessedAt: null,
    });

    expect(prismaItemTypeFindFirstMock).toHaveBeenCalledWith({
      where: {
        key: "command",
        isSystem: true,
      },
      select: {
        id: true,
        contentMode: true,
      },
    });
    expect(prismaItemCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          typeId: "type-command",
          title: "Build command",
          contentMode: "TEXT",
          tags: {
            create: [
              {
                tag: {
                  connectOrCreate: {
                    where: {
                      userId_name: {
                        userId: "user-1",
                        name: "cli",
                      },
                    },
                    create: {
                      userId: "user-1",
                      name: "cli",
                    },
                  },
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it("creates collection memberships for owned collections", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemTypeFindFirstMock.mockResolvedValue({
      id: "type-note",
      contentMode: "TEXT",
    });
    prismaCollectionFindManyMock.mockResolvedValue([
      {
        id: "collection-1",
      },
      {
        id: "collection-2",
      },
    ]);
    prismaItemCreateMock.mockResolvedValue({
      id: "item-1",
      title: "Launch notes",
      description: null,
      contentMode: "TEXT",
      content: "Ship it.",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: null,
      aiSummary: null,
      isPinned: false,
      isFavorite: false,
      createdAt,
      updatedAt,
      lastAccessedAt: null,
      type: {
        key: "note",
        name: "note",
      },
      tags: [],
      collections: [
        {
          collection: {
            id: "collection-1",
            name: "Planning",
          },
        },
        {
          collection: {
            id: "collection-2",
            name: "Launch",
          },
        },
      ],
    });

    await expect(
      createItem("user-1", {
        typeKey: "note",
        title: "Launch notes",
        description: null,
        content: "Ship it.",
        file: null,
        url: null,
        language: null,
        tags: [],
        collectionIds: ["collection-1", "collection-2", "collection-1", "other-user"],
      }),
    ).resolves.toMatchObject({
      collectionIds: ["collection-1", "collection-2"],
      collectionNames: ["Planning", "Launch"],
    });

    expect(prismaCollectionFindManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["collection-1", "collection-2", "other-user"],
        },
        userId: "user-1",
      },
      select: {
        id: true,
      },
    });
    expect(prismaItemCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            create: [
              {
                collection: {
                  connect: {
                    id: "collection-1",
                  },
                },
                sortOrder: 0,
              },
              {
                collection: {
                  connect: {
                    id: "collection-2",
                  },
                },
                sortOrder: 1,
              },
            ],
          },
        }),
      }),
    );
  });

  it("does not update an item that does not belong to the user", async () => {
    prismaItemFindFirstMock.mockResolvedValue(null);

    await expect(
      updateItem("user-1", "item-1", {
        title: "Updated title",
        description: null,
        content: null,
        url: null,
        language: null,
        tags: [],
      }),
    ).resolves.toBeNull();

    expect(prismaItemUpdateMock).not.toHaveBeenCalled();
  });

  it("updates editable fields and replaces tags for an owned item", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
    });
    prismaItemUpdateMock.mockResolvedValue({
      id: "item-1",
      title: "Updated auth helper",
      description: "A clearer description.",
      contentMode: "TEXT",
      content: "export function requireAuth() { return true; }",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "typescript",
      aiSummary: null,
      isPinned: false,
      isFavorite: true,
      createdAt,
      updatedAt,
      lastAccessedAt: null,
      type: {
        key: "snippet",
        name: "snippet",
      },
      tags: [
        {
          tag: {
            color: null,
            name: "auth",
          },
        },
      ],
      collections: [],
    });

    await expect(
      updateItem("user-1", "item-1", {
        title: "Updated auth helper",
        description: "A clearer description.",
        content: "export function requireAuth() { return true; }",
        url: null,
        language: "typescript",
        tags: ["auth", "auth"],
      }),
    ).resolves.toEqual({
      id: "item-1",
      title: "Updated auth helper",
      description: "A clearer description.",
      contentMode: "TEXT",
      content: "export function requireAuth() { return true; }",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "typescript",
      aiSummary: null,
      collectionIds: [],
      collectionNames: [],
      tags: [
        {
          color: null,
          name: "auth",
        },
      ],
      isPinned: false,
      isFavorite: true,
      typeKey: "snippet",
      typeLabel: "Snippet",
      createdAt,
      updatedAt,
      lastAccessedAt: null,
    });

    expect(prismaItemUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "item-1",
        },
        data: expect.objectContaining({
          title: "Updated auth helper",
          description: "A clearer description.",
          tags: {
            deleteMany: {},
            create: [
              {
                tag: {
                  connectOrCreate: {
                    where: {
                      userId_name: {
                        userId: "user-1",
                        name: "auth",
                      },
                    },
                    create: {
                      userId: "user-1",
                      name: "auth",
                    },
                  },
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it("toggles favorite state for an owned item", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemFindFirstMock.mockResolvedValue({
      isFavorite: false,
    });
    prismaItemUpdateMock.mockResolvedValue({
      id: "item-1",
      title: "Favorite command",
      description: null,
      contentMode: "TEXT",
      content: "npm run build",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "shell",
      aiSummary: null,
      isPinned: false,
      isFavorite: true,
      createdAt,
      updatedAt,
      lastAccessedAt: null,
      type: {
        key: "command",
        name: "command",
      },
      tags: [],
      collections: [],
    });

    await expect(toggleItemFavorite("user-1", "item-1")).resolves.toMatchObject({
      id: "item-1",
      isFavorite: true,
    });

    expect(prismaItemFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "item-1",
        userId: "user-1",
      },
      select: {
        isFavorite: true,
      },
    });
    expect(prismaItemUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "item-1",
      },
      data: {
        isFavorite: true,
      },
      select: expect.any(Object),
    });
  });

  it("does not toggle favorite state for another user's item", async () => {
    prismaItemFindFirstMock.mockResolvedValue(null);

    await expect(toggleItemFavorite("user-1", "item-1")).resolves.toBeNull();

    expect(prismaItemUpdateMock).not.toHaveBeenCalled();
  });

  it("replaces collection memberships for owned items", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
    });
    prismaCollectionFindManyMock.mockResolvedValue([
      {
        id: "collection-2",
      },
    ]);
    prismaItemUpdateMock.mockResolvedValue({
      id: "item-1",
      title: "Updated auth helper",
      description: null,
      contentMode: "TEXT",
      content: "Auth notes",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: null,
      aiSummary: null,
      isPinned: false,
      isFavorite: false,
      createdAt,
      updatedAt,
      lastAccessedAt: null,
      type: {
        key: "note",
        name: "note",
      },
      tags: [],
      collections: [
        {
          collection: {
            id: "collection-2",
            name: "Backend",
          },
        },
      ],
    });

    await expect(
      updateItem("user-1", "item-1", {
        title: "Updated auth helper",
        description: null,
        content: "Auth notes",
        url: null,
        language: null,
        tags: [],
        collectionIds: ["collection-2", "collection-2", "other-user"],
      }),
    ).resolves.toMatchObject({
      collectionIds: ["collection-2"],
      collectionNames: ["Backend"],
    });

    expect(prismaItemUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            deleteMany: {},
            create: [
              {
                collection: {
                  connect: {
                    id: "collection-2",
                  },
                },
                sortOrder: 0,
              },
            ],
          },
        }),
      }),
    );
  });

  it("does not delete an item that does not belong to the user", async () => {
    prismaItemFindFirstMock.mockResolvedValue(null);

    await expect(deleteItem("user-1", "item-1")).resolves.toBe(false);

    expect(prismaItemDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes an owned item", async () => {
    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
      fileKey: null,
    });
    prismaItemDeleteMock.mockResolvedValue({
      id: "item-1",
    });

    await expect(deleteItem("user-1", "item-1")).resolves.toBe(true);

    expect(prismaItemDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "item-1",
      },
    });
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("deletes an owned uploaded file from R2", async () => {
    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
      fileKey: "users/user-1/file/config.json",
    });
    prismaItemDeleteMock.mockResolvedValue({
      id: "item-1",
    });

    await expect(deleteItem("user-1", "item-1")).resolves.toBe(true);

    expect(deleteR2ObjectMock).toHaveBeenCalledWith("users/user-1/file/config.json");
    expect(prismaItemDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "item-1",
      },
    });
    expect(deleteR2ObjectMock.mock.invocationCallOrder[0]).toBeLessThan(
      prismaItemDeleteMock.mock.invocationCallOrder[0],
    );
  });

  it("does not delete the item row when R2 cleanup fails", async () => {
    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
      fileKey: "users/user-1/file/config.json",
    });
    deleteR2ObjectMock.mockRejectedValue(new Error("R2 unavailable"));

    await expect(deleteItem("user-1", "item-1")).rejects.toThrow("R2 unavailable");

    expect(prismaItemDeleteMock).not.toHaveBeenCalled();
  });

  it("checks whether an uploaded file key is attached to an item", async () => {
    prismaItemFindFirstMock.mockResolvedValueOnce({ id: "item-1" }).mockResolvedValueOnce(null);

    await expect(
      isItemFileKeyInUse("user-1", "users/user-1/file/config.json"),
    ).resolves.toBe(true);
    await expect(
      isItemFileKeyInUse("user-1", "users/user-1/file/unused.json"),
    ).resolves.toBe(false);
    expect(prismaItemFindFirstMock).toHaveBeenNthCalledWith(1, {
      where: {
        userId: "user-1",
        fileKey: "users/user-1/file/config.json",
      },
      select: {
        id: true,
      },
    });
  });
});
