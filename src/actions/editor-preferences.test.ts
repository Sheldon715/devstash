import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EditorPreferences } from "@/lib/editor-preferences";

const { authMock, prismaUserUpdateMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaUserUpdateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: prismaUserUpdateMock,
    },
  },
}));

import { updateEditorPreferences } from "@/actions/editor-preferences";

const validPreferences: EditorPreferences = {
  fontSize: 16,
  minimap: true,
  tabSize: 4,
  theme: "github-dark",
  wordWrap: false,
};

describe("editor preference actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    prismaUserUpdateMock.mockReset();
  });

  it("rejects invalid preference values before checking auth", async () => {
    const result = await updateEditorPreferences({
      ...validPreferences,
      fontSize: 99,
    } as unknown as EditorPreferences);

    expect(result).toEqual({
      data: null,
      error: "Choose valid editor preference values.",
      success: false,
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateEditorPreferences(validPreferences);

    expect(result).toEqual({
      data: null,
      error: "You need to be signed in to update editor preferences.",
      success: false,
    });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("updates editor preferences for the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });
    prismaUserUpdateMock.mockResolvedValue({
      editorPreferences: validPreferences,
    });

    const result = await updateEditorPreferences(validPreferences);

    expect(prismaUserUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "user-123",
      },
      data: {
        editorPreferences: validPreferences,
      },
      select: {
        editorPreferences: true,
      },
    });
    expect(result).toEqual({
      data: validPreferences,
      error: null,
      success: true,
    });
  });
});
