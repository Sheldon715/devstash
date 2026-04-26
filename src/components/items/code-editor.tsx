"use client";

import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BeforeMount, EditorProps, OnChange } from "@monaco-editor/react";

import { useEditorPreferences } from "@/components/items/editor-preferences-context";
import { getEditorLineHeight } from "@/lib/editor-preferences";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((module) => module.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-32 items-center justify-center bg-[#05070b] font-mono text-xs text-zinc-500">
        Loading editor
      </div>
    ),
  },
) as ComponentType<EditorProps>;

interface CodeEditorProps {
  className?: string;
  disabled?: boolean;
  language?: string | null;
  maxHeight?: number;
  minHeight?: number;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
}

export function CodeEditor({
  className,
  disabled = false,
  language,
  maxHeight = 400,
  minHeight = 180,
  onChange,
  readOnly = false,
  value,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const normalizedLanguage = normalizeEditorLanguage(language);
  const displayLanguage = getDisplayLanguage(language);
  const isReadOnly = readOnly || disabled || !onChange;
  const lineHeight = getEditorLineHeight(preferences.fontSize);
  const editorHeight = useMemo(
    () => getFluidEditorHeight(value, minHeight, maxHeight, lineHeight),
    [lineHeight, maxHeight, minHeight, value],
  );

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const editorOptions = useMemo<EditorProps["options"]>(
    () => ({
      automaticLayout: true,
      contextmenu: false,
      cursorBlinking: "smooth",
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", Consolas, monospace',
      fontLigatures: true,
      fontSize: preferences.fontSize,
      lineHeight,
      lineNumbers: "on",
      minimap: {
        enabled: preferences.minimap,
      },
      overviewRulerBorder: false,
      padding: {
        bottom: 16,
        top: 16,
      },
      readOnly: isReadOnly,
      renderLineHighlight: "line",
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        horizontalScrollbarSize: 9,
        verticalScrollbarSize: 9,
      },
      smoothScrolling: true,
      tabSize: preferences.tabSize,
      wordWrap: preferences.wordWrap ? "on" : "off",
    }),
    [isReadOnly, lineHeight, preferences],
  );

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monaco.editor.defineTheme("monokai", {
      base: "vs-dark",
      inherit: true,
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#3e3d32",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editorLineNumber.foreground": "#75715e",
        "editor.selectionBackground": "#49483e",
        "editorCursor.foreground": "#f8f8f0",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.activeBackground": "#75715e90",
        "scrollbarSlider.background": "#75715e55",
        "scrollbarSlider.hoverBackground": "#75715e75",
      },
      rules: [
        { token: "comment", foreground: "75715e", fontStyle: "italic" },
        { token: "keyword", foreground: "f92672" },
        { token: "number", foreground: "ae81ff" },
        { token: "string", foreground: "e6db74" },
        { token: "type", foreground: "66d9ef" },
      ],
    });

    monaco.editor.defineTheme("github-dark", {
      base: "vs-dark",
      inherit: true,
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editorLineNumber.activeForeground": "#e6edf3",
        "editorLineNumber.foreground": "#6e7681",
        "editor.selectionBackground": "#2f81f766",
        "editorCursor.foreground": "#58a6ff",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.activeBackground": "#6e768190",
        "scrollbarSlider.background": "#6e768155",
        "scrollbarSlider.hoverBackground": "#6e768175",
      },
      rules: [
        { token: "comment", foreground: "8b949e", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "number", foreground: "79c0ff" },
        { token: "string", foreground: "a5d6ff" },
        { token: "type", foreground: "d2a8ff" },
      ],
    });
  }, []);

  const handleEditorChange = useCallback<OnChange>(
    (nextValue) => {
      if (isReadOnly || !onChange) {
        return;
      }

      onChange(nextValue ?? "");
    },
    [isReadOnly, onChange],
  );

  async function handleCopy() {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1600);
    } catch {}
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#05070b] shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
        disabled ? "opacity-70" : "",
        className,
      )}
    >
      <div className="flex h-11 items-center gap-3 border-b border-white/8 bg-[#090d13] px-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">
          {displayLanguage}
        </span>
        <button
          type="button"
          disabled={!value}
          onClick={handleCopy}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/8 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isCopied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
          <span>{isCopied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div>
        <MonacoEditor
          height={editorHeight}
          language={normalizedLanguage}
          loading={
            <div className="flex h-full items-center justify-center bg-[#05070b] font-mono text-xs text-zinc-500">
              Loading editor
            </div>
          }
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          options={editorOptions}
          theme={preferences.theme}
          value={value}
          width="100%"
        />
      </div>
    </div>
  );
}

function getFluidEditorHeight(
  value: string,
  minHeight: number,
  maxHeight: number,
  lineHeight: number,
) {
  const lineCount = Math.max(1, value.split("\n").length);
  const contentHeight = lineCount * lineHeight + 34;

  return Math.min(maxHeight, Math.max(minHeight, contentHeight));
}

function getDisplayLanguage(language?: string | null) {
  const normalizedLanguage = language?.trim();

  return normalizedLanguage || "text";
}

function normalizeEditorLanguage(language?: string | null) {
  const normalizedLanguage = language?.trim().toLowerCase();

  if (!normalizedLanguage) {
    return "plaintext";
  }

  if (["bash", "shell", "sh", "terminal", "zsh"].includes(normalizedLanguage)) {
    return "shell";
  }

  if (normalizedLanguage === "ts") {
    return "typescript";
  }

  if (normalizedLanguage === "js") {
    return "javascript";
  }

  return normalizedLanguage;
}
