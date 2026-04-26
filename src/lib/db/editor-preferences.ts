import { normalizeEditorPreferences } from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

export async function getUserEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      editorPreferences: true,
    },
  });

  return normalizeEditorPreferences(user?.editorPreferences);
}
