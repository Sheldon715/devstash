import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  deleteR2ObjectMock,
  getUserBillingUsageMock,
  isItemFileKeyInUseMock,
  uploadR2ObjectMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteR2ObjectMock: vi.fn(),
  getUserBillingUsageMock: vi.fn(),
  isItemFileKeyInUseMock: vi.fn(),
  uploadR2ObjectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/usage", () => ({
  getUserBillingUsage: getUserBillingUsageMock,
}));

vi.mock("@/lib/db/items", () => ({
  isItemFileKeyInUse: isItemFileKeyInUseMock,
}));

vi.mock("@/lib/storage/r2", () => ({
  deleteR2Object: deleteR2ObjectMock,
  uploadR2Object: uploadR2ObjectMock,
}));

import { DELETE, POST } from "@/app/api/uploads/route";
import { POST as CLEANUP_POST } from "@/app/api/uploads/cleanup/route";

describe("POST /api/uploads", () => {
  beforeEach(() => {
    authMock.mockReset();
    getUserBillingUsageMock.mockReset();
    uploadR2ObjectMock.mockReset();
    getUserBillingUsageMock.mockResolvedValue({
      plan: "PRO",
      isPro: true,
      totalItems: 0,
      totalCollections: 0,
    });
  });

  it("returns 403 for Free users before reading the upload body", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getUserBillingUsageMock.mockResolvedValue({
      plan: "FREE",
      isPro: false,
      totalItems: 0,
      totalCollections: 0,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/uploads", {
        body: "not multipart",
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "File and image uploads require DevStash Pro.",
    });
    expect(response.status).toBe(403);
    expect(uploadR2ObjectMock).not.toHaveBeenCalled();
  });

  it("returns a generic error when R2 upload fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    uploadR2ObjectMock.mockRejectedValue(new Error("provider-specific failure"));

    const formData = new FormData();
    formData.set("type", "image");
    formData.set(
      "file",
      new File(["image"], "photo.png", {
        type: "image/png",
      }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/uploads", {
        body: formData,
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "We couldn't upload this file right now.",
    });
    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/uploads", () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteR2ObjectMock.mockReset();
    isItemFileKeyInUseMock.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost:3000/api/uploads", {
        body: JSON.stringify({
          fileKey: "users/user-1/file/config.json",
        }),
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(401);
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("rejects upload keys outside the signed-in user's storage prefix", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    const response = await DELETE(
      new Request("http://localhost:3000/api/uploads", {
        body: JSON.stringify({
          fileKey: "users/user-2/file/config.json",
        }),
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(404);
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("does not delete uploads that are already attached to an item", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isItemFileKeyInUseMock.mockResolvedValue(true);

    const response = await DELETE(
      new Request("http://localhost:3000/api/uploads", {
        body: JSON.stringify({
          fileKey: "users/user-1/file/config.json",
        }),
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(409);
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("deletes an unattached upload owned by the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isItemFileKeyInUseMock.mockResolvedValue(false);
    deleteR2ObjectMock.mockResolvedValue(undefined);

    const response = await DELETE(
      new Request("http://localhost:3000/api/uploads", {
        body: JSON.stringify({
          fileKey: "users/user-1/file/config.json",
        }),
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
    });
    expect(deleteR2ObjectMock).toHaveBeenCalledWith("users/user-1/file/config.json");
  });
});

describe("POST /api/uploads/cleanup", () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteR2ObjectMock.mockReset();
    isItemFileKeyInUseMock.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await CLEANUP_POST(
      new Request("http://localhost:3000/api/uploads/cleanup", {
        body: JSON.stringify({
          fileKey: "users/user-1/image/photo.webp",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("rejects cleanup keys outside the signed-in user's storage prefix", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    const response = await CLEANUP_POST(
      new Request("http://localhost:3000/api/uploads/cleanup", {
        body: JSON.stringify({
          fileKey: "users/user-2/image/photo.webp",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(404);
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("treats attached files as already clean without deleting them", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isItemFileKeyInUseMock.mockResolvedValue(true);

    const response = await CLEANUP_POST(
      new Request("http://localhost:3000/api/uploads/cleanup", {
        body: JSON.stringify({
          fileKey: "users/user-1/image/photo.webp",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
    });
    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
  });

  it("deletes an unattached upload owned by the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isItemFileKeyInUseMock.mockResolvedValue(false);
    deleteR2ObjectMock.mockResolvedValue(undefined);

    const response = await CLEANUP_POST(
      new Request("http://localhost:3000/api/uploads/cleanup", {
        body: JSON.stringify({
          fileKey: "users/user-1/image/photo.webp",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
    });
    expect(deleteR2ObjectMock).toHaveBeenCalledWith("users/user-1/image/photo.webp");
  });
});
