import { LoaderCircle } from "lucide-react";

interface RedirectLoadingOverlayProps {
  message?: string;
  title?: string;
}

export function RedirectLoadingOverlay({
  message = "Taking you to the next page.",
  title = "Loading",
}: RedirectLoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[220] grid place-items-center bg-background/82 px-4 text-foreground backdrop-blur-md"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#08090c] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-sky-200/20 bg-sky-200/10 text-sky-100">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-50">{title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
