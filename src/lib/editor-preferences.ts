import { z } from "zod";

export const EDITOR_FONT_SIZE_OPTIONS = [12, 13, 14, 16, 18] as const;
export const EDITOR_TAB_SIZE_OPTIONS = [2, 4, 8] as const;
export const EDITOR_THEME_OPTIONS = ["vs-dark", "monokai", "github-dark"] as const;

const editorFontSizeSchema = z.union([
  z.literal(12),
  z.literal(13),
  z.literal(14),
  z.literal(16),
  z.literal(18),
]);
const editorTabSizeSchema = z.union([z.literal(2), z.literal(4), z.literal(8)]);
const editorThemeSchema = z.enum(EDITOR_THEME_OPTIONS);

export const editorPreferencesSchema = z
  .object({
    fontSize: editorFontSizeSchema,
    minimap: z.boolean(),
    tabSize: editorTabSizeSchema,
    theme: editorThemeSchema,
    wordWrap: z.boolean(),
  })
  .strict();

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;
export type EditorTheme = EditorPreferences["theme"];

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  minimap: false,
  tabSize: 2,
  theme: "vs-dark",
  wordWrap: true,
};

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "github-dark": "GitHub Dark",
  monokai: "Monokai",
  "vs-dark": "VS Dark",
};

export function normalizeEditorPreferences(value: unknown): EditorPreferences {
  if (!isRecord(value)) {
    return DEFAULT_EDITOR_PREFERENCES;
  }

  return {
    fontSize: isEditorFontSize(value.fontSize)
      ? value.fontSize
      : DEFAULT_EDITOR_PREFERENCES.fontSize,
    minimap:
      typeof value.minimap === "boolean"
        ? value.minimap
        : DEFAULT_EDITOR_PREFERENCES.minimap,
    tabSize: isEditorTabSize(value.tabSize)
      ? value.tabSize
      : DEFAULT_EDITOR_PREFERENCES.tabSize,
    theme: isEditorTheme(value.theme) ? value.theme : DEFAULT_EDITOR_PREFERENCES.theme,
    wordWrap:
      typeof value.wordWrap === "boolean"
        ? value.wordWrap
        : DEFAULT_EDITOR_PREFERENCES.wordWrap,
  };
}

export function getEditorLineHeight(fontSize: EditorPreferences["fontSize"]) {
  return Math.max(19, Math.round(fontSize * 1.6));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEditorFontSize(value: unknown): value is EditorPreferences["fontSize"] {
  return EDITOR_FONT_SIZE_OPTIONS.some((option) => option === value);
}

function isEditorTabSize(value: unknown): value is EditorPreferences["tabSize"] {
  return EDITOR_TAB_SIZE_OPTIONS.some((option) => option === value);
}

function isEditorTheme(value: unknown): value is EditorTheme {
  return EDITOR_THEME_OPTIONS.some((option) => option === value);
}
