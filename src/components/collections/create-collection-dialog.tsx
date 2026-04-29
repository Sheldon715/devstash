"use client";

import { type FormEvent, useCallback, useState } from "react";
import { FolderPlus, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { SuccessToast } from "@/components/ui/success-toast";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateCollectionResponse {
  success: boolean;
  error?: string;
  status?: number;
}

interface CreateCollectionToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

const emptyFormState = {
  description: "",
  name: "",
};

export function CreateCollectionDialog({
  onOpenChange,
  open,
}: CreateCollectionDialogProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(emptyFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<CreateCollectionToastState | null>(null);
  const canSubmit = Boolean(formState.name.trim());

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    onOpenChange(nextOpen);
  }, [isSubmitting, onOpenChange]);

  function updateFormField(field: keyof typeof emptyFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let payload: CreateCollectionResponse;

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          description: formState.description,
        }),
      });

      payload = {
        ...((await response.json()) as CreateCollectionResponse),
        status: response.status,
      };
    } catch {
      payload = {
        success: false,
        error: "We couldn't create this collection right now.",
      };
    }

    setIsSubmitting(false);

    if (!payload.success) {
      const message = payload.error ?? "We couldn't create this collection right now.";

      if (payload.status !== 403) {
        setError(message);
      }

      setToastState({
        message,
        title: "Create failed",
        variant: "error",
      });
      return;
    }

    setFormState(emptyFormState);
    setToastState({
      message: "Collection created.",
      title: "Created",
      variant: "success",
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <DialogHeader>
                  <DialogTitle>New Collection</DialogTitle>
                  <DialogDescription>
                    Group related items with a reusable workspace label.
                  </DialogDescription>
                </DialogHeader>

                <DialogClose disabled={isSubmitting} className="size-10 shrink-0 rounded-xl p-0">
                  <X className="size-4" />
                  <span className="sr-only">Close create collection dialog</span>
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
                  onChange={(event) => updateFormField("name", event.target.value)}
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
                  onChange={(event) => updateFormField("description", event.target.value)}
                  className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>

            <DialogFooter className="border-t border-white/8 px-5 py-4">
              <DialogClose disabled={isSubmitting}>Cancel</DialogClose>
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="h-10 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
              >
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <FolderPlus className="size-4" />
                )}
                Create collection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {toastState ? (
        <SuccessToast
          message={toastState.message}
          onDone={() => setToastState(null)}
          title={toastState.title}
          variant={toastState.variant}
        />
      ) : null}
    </>
  );
}
