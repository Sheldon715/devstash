import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, createDashboardCollectionMock, getUserBillingUsageMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  createDashboardCollectionMock: vi.fn(),
  getUserBillingUsageMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/usage", () => ({
  getUserBillingUsage: getUserBillingUsageMock,
}));

vi.mock("@/lib/db/collections", () => ({
  createDashboardCollection: createDashboardCollectionMock,
}));

import { POST } from "@/app/api/collections/route";

describe("POST /api/collections", () => {
  beforeEach(() => {
    authMock.mockReset();
    createDashboardCollectionMock.mockReset();
    getUserBillingUsageMock.mockReset();
    getUserBillingUsageMock.mockResolvedValue({
      plan: "FREE",
      isPro: false,
      totalItems: 0,
      totalCollections: 0,
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(createJsonRequest({ name: "React Patterns" }));

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized.",
    });
    expect(response.status).toBe(401);
    expect(createDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("returns validation errors before creating the collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    const response = await POST(createJsonRequest({ name: "   " }));

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Collection name is required.",
    });
    expect(response.status).toBe(400);
    expect(createDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("creates a collection scoped to the signed-in user", async () => {
    const updatedAt = new Date("2026-04-25T02:15:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createDashboardCollectionMock.mockResolvedValue({
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

    const response = await POST(
      createJsonRequest({
        name: "  React Patterns  ",
        description: "  Reusable React implementation notes. ",
      }),
    );

    expect(createDashboardCollectionMock).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: "Reusable React implementation notes.",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "React Patterns",
        description: "Reusable React implementation notes.",
        descriptionValue: "Reusable React implementation notes.",
        isFavorite: false,
        itemCount: 0,
        typeCount: 0,
        dominantTypeKey: null,
        typeKeys: [],
        lastUpdatedAt: updatedAt.toISOString(),
      },
    });
  });

  it("blocks Free users at the collection limit", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getUserBillingUsageMock.mockResolvedValue({
      plan: "FREE",
      isPro: false,
      totalItems: 0,
      totalCollections: 3,
    });

    const response = await POST(createJsonRequest({ name: "React Patterns" }));

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Free workspaces can create up to 3 collections. Upgrade to Pro to create more.",
    });
    expect(response.status).toBe(403);
    expect(createDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("allows Pro users to create collections beyond the Free collection limit", async () => {
    const updatedAt = new Date("2026-04-25T02:15:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getUserBillingUsageMock.mockResolvedValue({
      plan: "PRO",
      isPro: true,
      totalItems: 0,
      totalCollections: 3,
    });
    createDashboardCollectionMock.mockResolvedValue({
      id: "collection-1",
      name: "React Patterns",
      description: null,
      descriptionValue: null,
      isFavorite: false,
      itemCount: 0,
      typeCount: 0,
      dominantTypeKey: null,
      typeKeys: [],
      lastUpdatedAt: updatedAt,
    });

    const response = await POST(createJsonRequest({ name: "React Patterns" }));

    expect(response.status).toBe(200);
    expect(createDashboardCollectionMock).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns 409 when the user already has a collection with the same name", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createDashboardCollectionMock.mockRejectedValue({
      code: "P2002",
    });

    const response = await POST(createJsonRequest({ name: "React Patterns" }));

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "A collection with this name already exists.",
    });
    expect(response.status).toBe(409);
  });
});

function createJsonRequest(body: unknown) {
  return new Request("http://localhost:3000/api/collections", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
