import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  deleteDashboardCollectionMock,
  toggleDashboardCollectionFavoriteMock,
  updateDashboardCollectionMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteDashboardCollectionMock: vi.fn(),
  toggleDashboardCollectionFavoriteMock: vi.fn(),
  updateDashboardCollectionMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  deleteDashboardCollection: deleteDashboardCollectionMock,
  toggleDashboardCollectionFavorite: toggleDashboardCollectionFavoriteMock,
  updateDashboardCollection: updateDashboardCollectionMock,
}));

import {
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";

describe("collection actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteDashboardCollectionMock.mockReset();
    toggleDashboardCollectionFavoriteMock.mockReset();
    updateDashboardCollectionMock.mockReset();
  });

  it("returns update validation errors before checking auth", async () => {
    const result = await updateCollection("collection-1", {
      name: "   ",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Collection name is required.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(updateDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user to update a collection", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateCollection("collection-1", {
      name: "React Patterns",
      description: "",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to update collections.",
    });
    expect(updateDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("trims and normalizes collection metadata before updating", async () => {
    const updatedAt = new Date("2026-04-25T04:30:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateDashboardCollectionMock.mockResolvedValue({
      id: "collection-1",
      name: "React Recipes",
      description: "Reusable patterns.",
      isFavorite: false,
      updatedAt,
    });

    const result = await updateCollection(" collection-1 ", {
      name: "  React Recipes  ",
      description: "  Reusable patterns. ",
    });

    expect(updateDashboardCollectionMock).toHaveBeenCalledWith("user-1", "collection-1", {
      name: "React Recipes",
      description: "Reusable patterns.",
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "React Recipes",
        description: "Reusable patterns.",
        isFavorite: false,
        updatedAt: updatedAt.toISOString(),
      },
      error: null,
    });
  });

  it("returns a duplicate-name error when the update violates the user collection name constraint", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateDashboardCollectionMock.mockRejectedValue({
      code: "P2002",
    });

    const result = await updateCollection("collection-1", {
      name: "Existing",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "A collection with this name already exists.",
    });
  });

  it("returns not found when updating a collection outside the signed-in user's account", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateDashboardCollectionMock.mockResolvedValue(null);

    const result = await updateCollection("collection-1", {
      name: "React Patterns",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Collection not found.",
    });
  });

  it("toggles a collection favorite for the signed-in user", async () => {
    const updatedAt = new Date("2026-04-25T04:30:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    toggleDashboardCollectionFavoriteMock.mockResolvedValue({
      id: "collection-1",
      name: "React Recipes",
      description: null,
      isFavorite: true,
      updatedAt,
    });

    const result = await toggleCollectionFavorite(" collection-1 ");

    expect(toggleDashboardCollectionFavoriteMock).toHaveBeenCalledWith(
      "user-1",
      "collection-1",
    );
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "React Recipes",
        description: null,
        isFavorite: true,
        updatedAt: updatedAt.toISOString(),
      },
      error: null,
    });
  });

  it("requires a signed-in user to toggle a collection favorite", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("collection-1");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to update collections.",
    });
    expect(toggleDashboardCollectionFavoriteMock).not.toHaveBeenCalled();
  });

  it("returns delete validation errors before checking auth", async () => {
    const result = await deleteCollection("   ");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Collection not found.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(deleteDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user to delete a collection", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to delete collections.",
    });
    expect(deleteDashboardCollectionMock).not.toHaveBeenCalled();
  });

  it("deletes a collection owned by the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteDashboardCollectionMock.mockResolvedValue(true);

    const result = await deleteCollection(" collection-1 ");

    expect(deleteDashboardCollectionMock).toHaveBeenCalledWith("user-1", "collection-1");
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
      },
      error: null,
    });
  });

  it("returns not found when deleting a collection outside the signed-in user's account", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteDashboardCollectionMock.mockResolvedValue(false);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Collection not found.",
    });
  });
});
