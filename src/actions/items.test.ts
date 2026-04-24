import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, createItemRecordMock, deleteItemRecordMock, updateItemRecordMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  createItemRecordMock: vi.fn(),
  deleteItemRecordMock: vi.fn(),
  updateItemRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemRecordMock,
  deleteItem: deleteItemRecordMock,
  updateItem: updateItemRecordMock,
}));

import { createItem, deleteItem, updateItem } from "@/actions/items";

describe("item actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("returns create validation errors before checking auth", async () => {
    const result = await createItem({
      typeKey: "snippet",
      title: "   ",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Title is required.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("requires a URL when creating link items", async () => {
    const result = await createItem({
      typeKey: "link",
      title: "Docs",
      description: null,
      content: null,
      url: "",
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "URL is required for link items.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user to create an item", async () => {
    authMock.mockResolvedValue(null);

    const result = await createItem({
      typeKey: "command",
      title: "Useful command",
      description: "",
      content: "npm run build",
      url: "",
      language: "shell",
      tags: ["cli"],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to create items.",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("trims and normalizes payloads before creating an item", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "Useful command",
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

    const result = await createItem({
      typeKey: "command",
      title: "  Useful command  ",
      description: "  Runs the production build. ",
      content: " npm run build ",
      url: "https://example.com/ignored",
      language: " shell ",
      tags: [" cli ", "cli"],
    });

    expect(createItemRecordMock).toHaveBeenCalledWith("user-1", {
      typeKey: "command",
      title: "Useful command",
      description: "Runs the production build.",
      content: "npm run build",
      url: null,
      language: "shell",
      tags: ["cli"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        title: "Useful command",
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
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        lastAccessedAt: null,
      },
      error: null,
    });
  });

  it("returns an error when the item type cannot be found", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    createItemRecordMock.mockResolvedValue(null);

    const result = await createItem({
      typeKey: "note",
      title: "Loose note",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Item type not found.",
    });
  });

  it("returns validation errors before checking auth", async () => {
    const result = await updateItem("item-1", {
      title: "   ",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Title is required.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for invalid URLs", async () => {
    const result = await updateItem("item-1", {
      title: "Reference link",
      description: null,
      content: null,
      url: "not-a-url",
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Enter a valid URL.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateItem("item-1", {
      title: "Useful command",
      description: "",
      content: "npm run build",
      url: "",
      language: "shell",
      tags: ["cli"],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to update items.",
    });
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("trims and normalizes payloads before updating the item", async () => {
    const createdAt = new Date("2026-04-22T03:12:00.000Z");
    const updatedAt = new Date("2026-04-24T08:30:00.000Z");

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "Useful command",
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
      collectionNames: ["Build"],
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

    const result = await updateItem("item-1", {
      title: "  Useful command  ",
      description: "  Runs the production build. ",
      content: " npm run build ",
      url: "",
      language: " shell ",
      tags: [" cli ", "cli"],
    });

    expect(updateItemRecordMock).toHaveBeenCalledWith("user-1", "item-1", {
      title: "Useful command",
      description: "Runs the production build.",
      content: "npm run build",
      url: null,
      language: "shell",
      tags: ["cli"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        title: "Useful command",
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
        collectionNames: ["Build"],
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
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        lastAccessedAt: null,
      },
      error: null,
    });
  });

  it("returns not found when the item is not owned by the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateItemRecordMock.mockResolvedValue(null);

    const result = await updateItem("item-1", {
      title: "Useful command",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Item not found.",
    });
  });

  it("returns delete validation errors before checking auth", async () => {
    const result = await deleteItem("   ");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Item not found.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user to delete an item", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to delete items.",
    });
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("deletes an item owned by the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteItemRecordMock.mockResolvedValue(true);

    const result = await deleteItem(" item-1 ");

    expect(deleteItemRecordMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
      },
      error: null,
    });
  });

  it("returns not found when deleting an item outside the signed-in user's account", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteItemRecordMock.mockResolvedValue(false);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Item not found.",
    });
  });
});
