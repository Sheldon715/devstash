"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { generateItemDescription } from "@/actions/ai";
import { Button } from "@/components/ui/button";

interface AiDescriptionButtonProps {
  content: string;
  description: string;
  disabled?: boolean;
  fileMimeType?: string | null;
  fileName?: string | null;
  isPro: boolean;
  itemType: string;
  onError: (message: string) => void;
  onGenerated: (description: string) => void;
  title: string;
  url?: string | null;
}

export function AiDescriptionButton({
  content,
  description,
  disabled = false,
  fileMimeType = null,
  fileName = null,
  isPro,
  itemType,
  onError,
  onGenerated,
  title,
  url = null,
}: AiDescriptionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isPro) {
    return null;
  }

  async function handleGenerateDescription() {
    if (disabled || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateItemDescription({
        title,
        description,
        content,
        itemType,
        url,
        fileName,
        fileMimeType,
      });

      if (!result.success) {
        onError(result.error);
        return;
      }

      onGenerated(result.data.description);
    } catch {
      onError("We couldn't generate a description right now.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled || isGenerating}
      aria-label="Generate description"
      title="Generate description"
      onClick={handleGenerateDescription}
      className="h-8 rounded-lg px-2.5 text-xs font-semibold text-sky-100/90 hover:bg-sky-300/10 hover:text-sky-50"
    >
      {isGenerating ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      Generate description
    </Button>
  );
}
