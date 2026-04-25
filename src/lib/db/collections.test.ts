import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaCollectionCreateMock } = vi.hoisted(() => ({
  prismaCollectionCreateMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: prismaCollectionCreateMock,
    },
  },
}));

import { createDashboardCollection } from "@/lib/db/collections";

describe("collection db queries", () => {
  beforeEach(() => {
    prismaCollectionCreateMock.mockReset();
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
});
