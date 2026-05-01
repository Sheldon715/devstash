"use client";

import dynamic from "next/dynamic";
import { Check, Copy, Crown, Loader2, Sparkles } from "lucide-react";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BeforeMount, EditorProps, OnChange } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  height?: EditorProps["height"];
  explanation?: string | null;
  explanationHeightClassName?: string;
  language?: string | null;
  maxHeight?: number;
  minHeight?: number;
  isExplaining?: boolean;
  onChange?: (value: string) => void;
  onExplain?: () => void;
  onExplainUnavailable?: () => void;
  readOnly?: boolean;
  showExplain?: boolean;
  value: string;
}

type CodeEditorTab = "code" | "explanation";

export function CodeEditor({
  className,
  disabled = false,
  explanation,
  explanationHeightClassName = "min-h-[180px] max-h-[400px]",
  height,
  isExplaining = false,
  language,
  maxHeight = 400,
  minHeight = 180,
  onChange,
  onExplain,
  onExplainUnavailable,
  readOnly = false,
  showExplain = false,
  value,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [activeTab, setActiveTab] = useState<CodeEditorTab>("code");
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const normalizedLanguage = normalizeEditorLanguage(language);
  const displayLanguage = getDisplayLanguage(language);
  const isReadOnly = readOnly || disabled || !onChange;
  const hasExplanation = Boolean(explanation);
  const activeContent = hasExplanation ? activeTab : "code";
  const copyValue = activeContent === "explanation" && explanation ? explanation : value;
  const lineHeight = getEditorLineHeight(preferences.fontSize);
  const editorHeight = useMemo(
    () => height ?? getFluidEditorHeight(value, minHeight, maxHeight, lineHeight),
    [height, lineHeight, maxHeight, minHeight, value],
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
    if (!copyValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      setIsCopied(true);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1600);
    } catch {}
  }

  async function handleExplainClick() {
    if (!showExplain || isExplaining) {
      return;
    }

    if (!onExplain) {
      onExplainUnavailable?.();
      return;
    }

    await onExplain();
    setActiveTab("explanation");
  }

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#05070b] shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
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
        {hasExplanation ? (
          <div
            className="flex min-w-0 flex-1 items-center gap-1"
            role="tablist"
            aria-label="Code explanation"
          >
            <CodeEditorTabButton
              active={activeTab === "code"}
              label="Code"
              onClick={() => setActiveTab("code")}
            />
            <CodeEditorTabButton
              active={activeTab === "explanation"}
              label="Explain"
              onClick={() => setActiveTab("explanation")}
            />
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">
            {displayLanguage}
          </span>
        )}
        {showExplain ? (
          <button
            type="button"
            disabled={isExplaining || !value}
            title={
              onExplain
                ? "Explain code"
                : "AI features require Pro subscription"
            }
            onClick={handleExplainClick}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-transparent bg-transparent px-2.5 text-xs font-medium text-violet-100 transition-colors hover:bg-white/[0.05] hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {onExplain ? (
              isExplaining ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )
            ) : (
              <Crown className="size-3.5 text-amber-200" />
            )}
            <span>{isExplaining ? "Explaining" : "Explain"}</span>
          </button>
        ) : null}
        <button
          type="button"
          disabled={!copyValue}
          onClick={handleCopy}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-transparent bg-transparent px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isCopied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
          <span>{isCopied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {activeContent === "explanation" && explanation ? (
        <div
          className={cn(
            "devstash-scrollbar markdown-preview overflow-auto bg-[#05070b] px-4 py-4 text-sm leading-7 text-zinc-200",
            explanationHeightClassName,
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function CodeEditorTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
        active
          ? "bg-white/[0.1] text-zinc-50"
          : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
      )}
    >
      {label}
    </button>
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
