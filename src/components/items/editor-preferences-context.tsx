"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_EDITOR_PREFERENCES,
  normalizeEditorPreferences,
} from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/lib/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  setPreferences: (preferences: EditorPreferences) => void;
}

export const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  preferences: DEFAULT_EDITOR_PREFERENCES,
  setPreferences: () => {},
});

export function EditorPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: ReactNode;
  initialPreferences: EditorPreferences;
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(() =>
    normalizeEditorPreferences(initialPreferences),
  );
  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
    }),
    [preferences],
  );

  return (
    <EditorPreferencesContext.Provider value={value}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext);
}
