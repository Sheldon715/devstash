import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, deleteR2ObjectMock, isItemFileKeyInUseMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteR2ObjectMock: vi.fn(),
  isItemFileKeyInUseMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  isItemFileKeyInUse: isItemFileKeyInUseMock,
}));

vi.mock("@/lib/storage/r2", () => ({
  deleteR2Object: deleteR2ObjectMock,
  uploadR2Object: vi.fn(),
}));

import { DELETE } from "@/app/api/uploads/route";

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
