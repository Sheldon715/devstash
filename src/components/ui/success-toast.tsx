"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  title?: string;
  onDone: () => void;
}

export function SuccessToast({
  message,
  onDone,
  title = "Success",
}: SuccessToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const dismissTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, 2600);

    const removeTimer = window.setTimeout(() => {
      onDone();
    }, 2820);

    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(removeTimer);
    };
  }, [onDone]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed left-1/2 top-5 z-[130] w-full max-w-md -translate-x-1/2 px-4 sm:top-6">
      <div
        className={`${
          isLeaving ? "profile-toast-exit" : "profile-toast-enter"
        } flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-[#101712] px-4 py-3 text-emerald-50 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md`}
      >
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <CheckCircle2 className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-emerald-100/85">{message}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsLeaving(true)}
          className="inline-flex size-8 items-center justify-center rounded-lg text-emerald-100/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
          <span className="sr-only">Close success toast</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
