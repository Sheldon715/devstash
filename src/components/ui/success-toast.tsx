"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  title?: string;
  variant?: "error" | "success";
  onDone: () => void;
}

export function SuccessToast({
  message,
  onDone,
  title = "Success",
  variant = "success",
}: SuccessToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const isError = variant === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

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
    <div className="pointer-events-none fixed left-1/2 top-6 z-[220] w-full max-w-md -translate-x-1/2 px-4 sm:top-8">
      <div
        className={`${
          isLeaving ? "profile-toast-exit" : "profile-toast-enter"
        } pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md ${
          isError
            ? "border-rose-300/20 bg-[#1a1014] text-rose-50"
            : "border-emerald-300/20 bg-[#101712] text-emerald-50"
        }`}
      >
        <div
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
            isError ? "bg-rose-400/15 text-rose-300" : "bg-emerald-400/15 text-emerald-300"
          }`}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className={`mt-1 text-sm leading-5 ${isError ? "text-rose-100/85" : "text-emerald-100/85"}`}>
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsLeaving(true)}
          className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10 hover:text-white ${
            isError ? "text-rose-100/80" : "text-emerald-100/80"
          }`}
        >
          <X className="size-4" />
          <span className="sr-only">Close success toast</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
