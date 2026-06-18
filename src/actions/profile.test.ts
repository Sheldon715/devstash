import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  signOutMock,
  compareMock,
  hashMock,
  prismaUserFindUniqueMock,
  prismaUserUpdateMock,
  prismaUserDeleteMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  signOutMock: vi.fn(),
  compareMock: vi.fn(),
  hashMock: vi.fn(),
  prismaUserFindUniqueMock: vi.fn(),
  prismaUserUpdateMock: vi.fn(),
  prismaUserDeleteMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  signOut: signOutMock,
}));

vi.mock("bcryptjs", () => ({
  compare: compareMock,
  hash: hashMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: prismaUserFindUniqueMock,
      update: prismaUserUpdateMock,
      delete: prismaUserDeleteMock,
    },
  },
}));

import { changePasswordAction, deleteAccountAction } from "@/actions/profile";

function createPasswordChangeFormData() {
  const formData = new FormData();

  formData.set("currentPassword", "current-password");
  formData.set("newPassword", "brand-new-password");
  formData.set("confirmPassword", "brand-new-password");

  return formData;
}

describe("profile actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    signOutMock.mockReset();
    compareMock.mockReset();
    hashMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
    prismaUserUpdateMock.mockReset();
    prismaUserDeleteMock.mockReset();
  });

  it("returns a validation error when change-password fields are missing", async () => {
    const result = await changePasswordAction(
      { error: null, success: null },
      new FormData(),
    );

    expect(result).toEqual({
      error: "Enter your current password, new password, and confirmation.",
      success: null,
    });
    expect(authMock).not.toHaveBeenCalled();
  });

  it("updates the signed-in user's password when the current password is valid", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });
    prismaUserFindUniqueMock.mockResolvedValue({
      passwordHash: "existing-hash",
    });
    compareMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    hashMock.mockResolvedValue("new-hash");

    const result = await changePasswordAction(
      { error: null, success: null },
      createPasswordChangeFormData(),
    );

    expect(prismaUserUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "user-123",
      },
      data: {
        passwordHash: "new-hash",
      },
    });
    expect(hashMock).toHaveBeenCalledWith("brand-new-password", 12);
    expect(result).toEqual({
      error: null,
      success: "Your password has been updated.",
    });
  });

  it("requires DELETE confirmation before deleting the account", async () => {
    const formData = new FormData();
    formData.set("confirmation", "delete");

    const result = await deleteAccountAction({ error: null }, formData);

    expect(result).toEqual({
      error: 'Type "DELETE" to confirm account deletion.',
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaUserDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes the signed-in user account and signs them out", async () => {
    const formData = new FormData();
    formData.set("confirmation", "DELETE");
    authMock.mockResolvedValue({
      user: {
        id: "user-456",
      },
    });

    const result = await deleteAccountAction({ error: null }, formData);

    expect(prismaUserDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "user-456",
      },
    });
    expect(signOutMock).toHaveBeenCalledWith({
      redirectTo: "/sign-in?deleted=1",
    });
    expect(result).toEqual({
      error: null,
    });
  });
});
