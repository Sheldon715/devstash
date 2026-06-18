"use client";

import type { FormEventHandler } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CollectionFormState {
  description: string;
  name: string;
}

interface CollectionFormDialogProps {
  closeLabel: string;
  description: string;
  error: string | null;
  formState: CollectionFormState;
  isOpen: boolean;
  isSubmitting: boolean;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitIcon: LucideIcon;
  submitLabel: string;
  submittingLabel: string;
  title: string;
}

export function CollectionFormDialog({
  closeLabel,
  description,
  error,
  formState,
  isOpen,
  isSubmitting,
  onDescriptionChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  submitIcon: SubmitIcon,
  submitLabel,
  submittingLabel,
  title,
}: CollectionFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>

              <DialogClose disabled={isSubmitting} className="size-10 shrink-0 rounded-xl p-0">
                <X className="size-4" />
                <span className="sr-only">{closeLabel}</span>
              </DialogClose>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                {error}
              </div>
            ) : null}

            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                Name <span className="text-rose-300">*</span>
              </span>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Collection name"
                value={formState.name}
                onChange={(event) => onNameChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                Description
              </span>
              <textarea
                disabled={isSubmitting}
                placeholder="Optional description"
                value={formState.description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>

          <DialogFooter className="border-t border-white/8 px-5 py-4">
            <DialogClose disabled={isSubmitting}>Cancel</DialogClose>
            <Button
              type="submit"
              disabled={!formState.name.trim() || isSubmitting}
              className="h-10 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
            >
              <SubmitIcon className={`size-4 ${isSubmitting ? "animate-spin" : ""}`} />
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
