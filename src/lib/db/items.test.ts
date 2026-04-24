import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaItemDeleteMock, prismaItemFindFirstMock, prismaItemUpdateMock } = vi.hoisted(() => ({
  prismaItemDeleteMock: vi.fn(),
  prismaItemFindFirstMock: vi.fn(),
  prismaItemUpdateMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      delete: prismaItemDeleteMock,
      findFirst: prismaItemFindFirstMock,
      update: prismaItemUpdateMock,
    },
    itemType: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { deleteItem, getDashboardItemDetail, updateItem } from "@/lib/db/items";

describe("item db queries", () => {
  beforeEach(() => {
    prismaItemDeleteMock.mockReset();
    prismaItemFindFirstMock.mockReset();
    prismaItemUpdateMock.mockReset();
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

  it("does not delete an item that does not belong to the user", async () => {
    prismaItemFindFirstMock.mockResolvedValue(null);

    await expect(deleteItem("user-1", "item-1")).resolves.toBe(false);

    expect(prismaItemDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes an owned item", async () => {
    prismaItemFindFirstMock.mockResolvedValue({
      id: "item-1",
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
  });
});
