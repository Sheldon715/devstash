import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  getEditorLineHeight,
  normalizeEditorPreferences,
} from "@/lib/editor-preferences";

describe("editor preferences", () => {
  it("returns defaults for empty or invalid stored values", () => {
    expect(normalizeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(
      normalizeEditorPreferences({
        fontSize: 99,
        minimap: "yes",
        tabSize: 3,
        theme: "solarized",
        wordWrap: "on",
      }),
    ).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps valid stored preference values", () => {
    expect(
      normalizeEditorPreferences({
        fontSize: 16,
        minimap: true,
        tabSize: 4,
        theme: "monokai",
        wordWrap: false,
      }),
    ).toEqual({
      fontSize: 16,
      minimap: true,
      tabSize: 4,
      theme: "monokai",
      wordWrap: false,
    });
  });

  it("derives a readable Monaco line height from font size", () => {
    expect(getEditorLineHeight(12)).toBe(19);
    expect(getEditorLineHeight(18)).toBe(29);
  });
});
