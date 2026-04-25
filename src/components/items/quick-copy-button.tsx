"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, Copy, LoaderCircle } from "lucide-react";

interface QuickCopyButtonProps {
  itemId: string;
  fallbackValue: string;
  className?: string;
}

interface ItemDetailResponseBody {
  error?: string;
  success?: boolean;
  data?: {
    content: string | null;
    description: string | null;
    fileUrl: string | null;
    title: string;
    url: string | null;
  };
}

export function QuickCopyButton({ className = "", fallbackValue, itemId }: QuickCopyButtonProps) {
  const [status, setStatus] = useState<"copied" | "idle" | "loading">("idle");
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (status === "loading") {
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`/api/items/${itemId}`);
      const responseBody = (await response.json()) as ItemDetailResponseBody;

      if (!response.ok || !responseBody.success || !responseBody.data) {
        throw new Error(responseBody.error ?? "Copy failed.");
      }

      await navigator.clipboard.writeText(getCopyValue(responseBody.data, fallbackValue));
      setStatus("copied");

      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }

      resetTimeoutRef.current = window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      try {
        await navigator.clipboard.writeText(fallbackValue);
        setStatus("copied");

        resetTimeoutRef.current = window.setTimeout(() => setStatus("idle"), 1600);
      } catch {
        setStatus("idle");
      }
    }
  }

  const Icon = status === "copied" ? Check : status === "loading" ? LoaderCircle : Copy;

  return (
    <button
      type="button"
      onClick={handleCopy}
      onKeyDown={(event) => event.stopPropagation()}
      disabled={status === "loading"}
      title={status === "copied" ? "Copied" : "Quick copy"}
      className={[
        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors",
        "hover:border-sky-200/30 hover:bg-sky-300/10 hover:text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
        status === "copied" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "",
        status === "loading" ? "cursor-wait opacity-80" : "",
        className,
      ].join(" ")}
      aria-label={status === "copied" ? "Copied" : "Quick copy item content"}
    >
      <Icon className={`size-4 ${status === "loading" ? "animate-spin" : ""}`} />
    </button>
  );
}

function getCopyValue(
  item: NonNullable<ItemDetailResponseBody["data"]>,
  fallbackValue: string,
) {
  return item.content ?? item.url ?? item.fileUrl ?? item.description ?? item.title ?? fallbackValue;
}
