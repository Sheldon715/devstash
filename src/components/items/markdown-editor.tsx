"use client";

import { Check, Copy, Crown, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface OptimizedPromptSuggestion {
  optimizedPrompt: string;
  changes: string[];
}

interface MarkdownEditorProps {
  className?: string;
  disabled?: boolean;
  heightClassName?: string;
  maxHeight?: number;
  minHeight?: number;
  onAcceptOptimized?: (optimizedPrompt: string) => Promise<void> | void;
  onChange?: (value: string) => void;
  onOptimizeError?: (message: string) => void;
  onOptimizeUnavailable?: () => void;
  onOptimize?: () => Promise<OptimizedPromptSuggestion>;
  placeholder?: string;
  readOnly?: boolean;
  showOptimize?: boolean;
  value: string;
}

type MarkdownEditorTab = "preview" | "write";

export function MarkdownEditor({
  className,
  disabled = false,
  heightClassName: customHeightClassName,
  maxHeight = 400,
  minHeight = 180,
  onAcceptOptimized,
  onChange,
  onOptimize,
  onOptimizeError,
  onOptimizeUnavailable,
  placeholder,
  readOnly = false,
  showOptimize = false,
  value,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<MarkdownEditorTab>(readOnly ? "preview" : "write");
  const [isCopied, setIsCopied] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [isAcceptingOptimized, setIsAcceptingOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const preOptimizedValueRef = useRef<string | null>(null);
  const isReadOnly = readOnly || disabled || !onChange;
  const editorRows = useMemo(
    () => getFluidEditorRows(draftValue, minHeight, maxHeight),
    [draftValue, maxHeight, minHeight],
  );
  const heightClassName = customHeightClassName ?? getEditorHeightClassName(minHeight, maxHeight);
  const shouldShowPreview = isReadOnly || activeTab === "preview";
  const currentValue = draftValue;

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  async function handleCopy() {
    const copyValue = currentValue;

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

  async function handleOptimizeClick() {
    if (!showOptimize || isOptimizing) {
      return;
    }

    if (!onOptimize) {
      onOptimizeUnavailable?.();
      return;
    }

    setIsOptimizing(true);

    try {
      const preOptimizedValue = currentValue;
      const result = await onOptimize();

      preOptimizedValueRef.current = preOptimizedValue;
      setDraftValue(result.optimizedPrompt);
      setOptimizedPrompt(result.optimizedPrompt);
      setActiveTab(readOnly ? "preview" : "write");
    } catch {
      onOptimizeError?.("We couldn't optimize this prompt right now.");
    } finally {
      setIsOptimizing(false);
    }
  }

  async function handleAcceptOptimizedPrompt() {
    if (!optimizedPrompt || isAcceptingOptimized) {
      return;
    }

    setIsAcceptingOptimized(true);
    const acceptedValue = currentValue;

    setDraftValue(acceptedValue);

    try {
      if (onAcceptOptimized) {
        await onAcceptOptimized(acceptedValue);
      } else {
        onChange?.(acceptedValue);
      }

      preOptimizedValueRef.current = null;
      setOptimizedPrompt(null);
      setActiveTab(readOnly ? "preview" : "write");
    } catch {
      onOptimizeError?.("We couldn't use the optimized prompt right now.");
    } finally {
      setIsAcceptingOptimized(false);
    }
  }

  function handleRejectOptimizedPrompt() {
    const previousValue = preOptimizedValueRef.current ?? value;

    setDraftValue(previousValue);
    onChange?.(previousValue);
    preOptimizedValueRef.current = null;
    setOptimizedPrompt(null);
    setActiveTab(readOnly ? "preview" : "write");
  }

  const displayValue = currentValue;

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
        disabled ? "opacity-70" : "",
        className,
      )}
    >
      <div className="flex h-11 items-center gap-3 border-b border-white/8 bg-[#2d2d2d] px-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>

        {isReadOnly ? (
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">
            markdown preview
          </span>
        ) : (
          <div
            className="flex min-w-0 flex-1 items-center gap-1"
            role="tablist"
            aria-label="Markdown editor"
          >
            <MarkdownTabButton
              active={activeTab === "write"}
              label="Write"
              onClick={() => setActiveTab("write")}
            />
            <MarkdownTabButton
              active={activeTab === "preview"}
              label="Preview"
              onClick={() => setActiveTab("preview")}
            />
          </div>
        )}

        {showOptimize ? (
          <button
            type="button"
            disabled={isOptimizing || isAcceptingOptimized || Boolean(optimizedPrompt) || !currentValue}
            title={onOptimize ? "Optimize prompt" : "AI features require Pro subscription"}
            onClick={handleOptimizeClick}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-transparent bg-transparent px-2.5 text-xs font-medium text-violet-100 transition-colors hover:bg-white/[0.05] hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {onOptimize ? (
              isOptimizing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )
            ) : (
              <Crown className="size-3.5 text-amber-200" />
            )}
            <span>{isOptimizing ? "Optimizing" : "Optimize"}</span>
          </button>
        ) : null}

        {optimizedPrompt ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isAcceptingOptimized}
              onClick={handleAcceptOptimizedPrompt}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAcceptingOptimized ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span>{isAcceptingOptimized ? "Saving" : "Use"}</span>
            </button>
            <button
              type="button"
              disabled={isAcceptingOptimized}
              onClick={handleRejectOptimizedPrompt}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="size-3.5" />
              <span>Keep</span>
            </button>
          </div>
        ) : null}

        <button
          type="button"
          disabled={!currentValue}
          onClick={handleCopy}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/8 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isCopied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
          <span>{isCopied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {shouldShowPreview ? (
        <div
          className={cn(
            "devstash-scrollbar markdown-preview overflow-auto px-4 py-4 text-sm leading-7 text-zinc-200",
            heightClassName,
          )}
        >
          {displayValue.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayValue}</ReactMarkdown>
          ) : (
            <p className="text-zinc-500">{placeholder ?? "Nothing to preview yet."}</p>
          )}
        </div>
      ) : (
        <textarea
          disabled={disabled}
          placeholder={placeholder}
          value={currentValue}
          onChange={(event) => {
            const nextValue = event.target.value;

            setDraftValue(nextValue);

            if (!optimizedPrompt) {
              onChange?.(nextValue);
            }
          }}
          rows={editorRows}
          className={cn(
            "block w-full resize-y bg-[#1e1e1e] px-4 py-4 font-mono text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 disabled:cursor-not-allowed",
            heightClassName,
          )}
        />
      )}
    </div>
  );
}

function MarkdownTabButton({
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

function getFluidEditorRows(value: string, minHeight: number, maxHeight: number) {
  const lineCount = Math.max(1, value.split("\n").length);
  const minRows = Math.max(4, Math.floor((minHeight - 32) / 24));
  const maxRows = Math.max(minRows, Math.floor((maxHeight - 32) / 24));

  return Math.min(maxRows, Math.max(minRows, lineCount));
}

function getEditorHeightClassName(minHeight: number, maxHeight: number) {
  let minHeightClassName = "min-h-[180px]";

  if (minHeight >= 260) {
    minHeightClassName = "min-h-[260px]";
  } else if (minHeight >= 220) {
    minHeightClassName = "min-h-[220px]";
  }

  const maxHeightClassName = maxHeight <= 320 ? "max-h-[320px]" : "max-h-[400px]";

  return `${minHeightClassName} ${maxHeightClassName}`;
}
