"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

import { deleteAccountAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteAccountCardProps {
  email: string;
}

const INITIAL_DELETE_ACCOUNT_STATE = {
  error: null,
};

export function DeleteAccountCard({ email }: DeleteAccountCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState("");
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    INITIAL_DELETE_ACCOUNT_STATE,
  );

  return (
    <>
      <div className="rounded-[1.75rem] border border-rose-400/18 bg-rose-400/[0.05] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-rose-400/12 text-rose-200">
            <Trash2 className="size-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-50">
                Delete account
              </h3>
              <p className="text-sm leading-6 text-zinc-300">
                Permanently remove <span className="font-medium text-white">{email}</span> and
                all associated items, collections, and account data.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-rose-300/18 bg-rose-400/10 px-4 text-rose-100 hover:bg-rose-400/14 hover:text-white"
              onClick={() => {
                setConfirmationValue("");
                setIsDialogOpen(true);
              }}
            >
              <Trash2 className="size-4" />
              Delete account
            </Button>
          </div>
        </div>
      </div>

      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm transition-opacity duration-200">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#090a0e] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.52)] transition-all duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-rose-400/12 text-rose-200">
                <AlertTriangle className="size-5" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                  Confirm account deletion
                </h2>
                <p className="text-sm leading-6 text-zinc-300">
                  This cannot be undone. Type <span className="font-semibold text-white">DELETE</span> to
                  confirm.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Close confirmation dialog</span>
            </Button>
          </div>

          <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="delete-confirmation" className="text-sm font-medium text-zinc-200">
                Type DELETE
              </label>
              <Input
                id="delete-confirmation"
                name="confirmation"
                value={confirmationValue}
                onChange={(event) => setConfirmationValue(event.target.value)}
                placeholder="DELETE"
                className="h-12 rounded-2xl border-white/12 bg-white/[0.03] text-white placeholder:text-zinc-500"
              />
            </div>

            {state.error ? (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {state.error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-white/12 bg-white/[0.03] px-4 text-zinc-100 hover:bg-white/[0.08]"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-2xl bg-rose-300 px-4 text-black hover:bg-rose-200"
                disabled={isPending || confirmationValue.trim() !== "DELETE"}
              >
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete forever
              </Button>
            </div>
          </form>
        </div>
        </div>
      ) : null}
    </>
  );
}
