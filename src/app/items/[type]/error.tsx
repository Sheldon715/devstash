"use client";

import { Button } from "@/components/ui/button";

interface ItemTypeErrorProps {
  error: Error;
  reset: () => void;
}

export default function ItemTypeError({ error, reset }: ItemTypeErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#08090c] p-6 text-center shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Item Type</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
          This view failed to load
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {error.message || "We couldn't load these items right now."}
        </p>
        <Button className="mt-6 rounded-xl" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
