"use client";

import { Check, LoaderCircle, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { generateAutoTags } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiTagSuggestionsProps {
  content: string;
  description: string;
  disabled?: boolean;
  isPro: boolean;
  onAccept: (tag: string) => void;
  onError: (message: string) => void;
  title: string;
}

export function AiTagSuggestions({
  content,
  description,
  disabled = false,
  isPro,
  onAccept,
  onError,
  title,
}: AiTagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  if (!isPro) {
    return null;
  }

  async function handleSuggestTags() {
    if (disabled || isSuggesting) {
      return;
    }

    setIsSuggesting(true);

    try {
      const result = await generateAutoTags({
        title,
        description,
        content,
      });

      if (!result.success) {
        onError(result.error);
        return;
      }

      setSuggestions(result.data.tags);
    } catch {
      onError("We couldn't suggest tags right now.");
    } finally {
      setIsSuggesting(false);
    }
  }

  function acceptTag(tag: string) {
    onAccept(tag);
    removeTag(tag);
  }

  function removeTag(tag: string) {
    setSuggestions((current) => current.filter((suggestion) => suggestion !== tag));
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || isSuggesting}
        onClick={handleSuggestTags}
        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-sky-100/90 hover:bg-sky-300/10 hover:text-sky-50"
      >
        {isSuggesting ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        Suggest Tags
      </Button>

      {suggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <span
              key={tag}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-sky-300/20 bg-sky-300/10 py-1 pl-2.5 pr-1 text-xs font-medium text-sky-100"
            >
              <span className="min-w-0 truncate">{tag}</span>
              <TagSuggestionButton
                label={`Accept ${tag}`}
                className="hover:bg-emerald-300/15 hover:text-emerald-100"
                onClick={() => acceptTag(tag)}
              >
                <Check className="size-3" />
              </TagSuggestionButton>
              <TagSuggestionButton
                label={`Reject ${tag}`}
                className="hover:bg-rose-300/15 hover:text-rose-100"
                onClick={() => removeTag(tag)}
              >
                <X className="size-3" />
              </TagSuggestionButton>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TagSuggestionButton({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-sky-100/70 transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}
