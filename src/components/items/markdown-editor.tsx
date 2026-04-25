"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  className?: string;
  disabled?: boolean;
  maxHeight?: number;
  minHeight?: number;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}

type MarkdownEditorTab = "preview" | "write";

export function MarkdownEditor({
  className,
  disabled = false,
  maxHeight = 400,
  minHeight = 180,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<MarkdownEditorTab>(readOnly ? "preview" : "write");
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const isReadOnly = readOnly || disabled || !onChange;
  const editorRows = useMemo(
    () => getFluidEditorRows(value, minHeight, maxHeight),
    [maxHeight, minHeight, value],
  );
  const heightClassName = getEditorHeightClassName(minHeight, maxHeight);
  const shouldShowPreview = isReadOnly || activeTab === "preview";

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

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
        "overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
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

      {shouldShowPreview ? (
        <div
          className={cn(
            "devstash-scrollbar markdown-preview overflow-auto px-4 py-4 text-sm leading-7 text-zinc-200",
            heightClassName,
          )}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-zinc-500">{placeholder ?? "Nothing to preview yet."}</p>
          )}
        </div>
      ) : (
        <textarea
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
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
