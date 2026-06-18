"use server";

import { getActionUserId } from "@/actions/_shared";
import {
  editorPreferencesSchema,
  normalizeEditorPreferences,
} from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

interface UpdateEditorPreferencesResult {
  data: EditorPreferences | null;
  error: string | null;
  success: boolean;
}

export async function updateEditorPreferences(
  preferences: EditorPreferences,
): Promise<UpdateEditorPreferencesResult> {
  const parsedPreferences = editorPreferencesSchema.safeParse(preferences);

  if (!parsedPreferences.success) {
    return {
      data: null,
      error: "Choose valid editor preference values.",
      success: false,
    };
  }

  const userId = await getActionUserId();

  if (!userId) {
    return {
      data: null,
      error: "You need to be signed in to update editor preferences.",
      success: false,
    };
  }

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      editorPreferences: parsedPreferences.data,
    },
    select: {
      editorPreferences: true,
    },
  });

  return {
    data: normalizeEditorPreferences(user.editorPreferences),
    error: null,
    success: true,
  };
}
