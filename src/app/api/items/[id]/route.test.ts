import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getDashboardItemDetailMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getDashboardItemDetailMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  getDashboardItemDetail: getDashboardItemDetailMock,
}));

import { GET } from "@/app/api/items/[id]/route";

describe("GET /api/items/[id]", () => {
  beforeEach(() => {
    authMock.mockReset();
    getDashboardItemDetailMock.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost:3000/api/items/item-1"), {
      params: Promise.resolve({
        id: "item-1",
      }),
    });

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized.",
    });
    expect(response.status).toBe(401);
    expect(getDashboardItemDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the item does not exist for the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getDashboardItemDetailMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost:3000/api/items/item-2"), {
      params: Promise.resolve({
        id: "item-2",
      }),
    });

    expect(getDashboardItemDetailMock).toHaveBeenCalledWith("user-1", "item-2");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(response.status).toBe(404);
  });

  it("returns serialized item detail data for the signed-in user", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-23T09:45:00.000Z");
    const lastAccessedAt = new Date("2026-04-23T10:15:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getDashboardItemDetailMock.mockResolvedValue({
      id: "item-3",
      title: "Review prompt",
      description: "Reusable code review instructions.",
      contentMode: "TEXT",
      content: "Review this like a senior engineer.",
      url: null,
      fileName: null,
      fileUrl: null,
      fileMimeType: null,
      fileSizeBytes: null,
      language: "markdown",
      aiSummary: null,
      collectionNames: ["AI Workflows"],
      tags: [
        {
          color: null,
          name: "review",
        },
      ],
      isPinned: false,
      isFavorite: true,
      typeKey: "prompt",
      typeLabel: "Prompt",
      createdAt,
      updatedAt,
      lastAccessedAt,
    });

    const response = await GET(new Request("http://localhost:3000/api/items/item-3"), {
      params: Promise.resolve({
        id: "item-3",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "item-3",
        title: "Review prompt",
        description: "Reusable code review instructions.",
        contentMode: "TEXT",
        content: "Review this like a senior engineer.",
        url: null,
        fileName: null,
        fileUrl: null,
        fileMimeType: null,
        fileSizeBytes: null,
        language: "markdown",
        aiSummary: null,
        collectionNames: ["AI Workflows"],
        tags: [
          {
            color: null,
            name: "review",
          },
        ],
        isPinned: false,
        isFavorite: true,
        typeKey: "prompt",
        typeLabel: "Prompt",
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        lastAccessedAt: lastAccessedAt.toISOString(),
      },
    });
  });
});
