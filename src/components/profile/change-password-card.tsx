"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, LoaderCircle, X } from "lucide-react";

import { changePasswordAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessToast } from "@/components/ui/success-toast";
import { PASSWORD_RESET_MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

type ChangePasswordFormState = {
  error: string | null;
  success: string | null;
};

const INITIAL_CHANGE_PASSWORD_STATE: ChangePasswordFormState = {
  error: null,
  success: null,
};

export function ChangePasswordCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <>
      <div className="account-action-row rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
        <p className="text-sm font-semibold text-zinc-50">Change password</p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Update your email-password credential without leaving settings.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-200 active:translate-y-0 active:scale-[0.98]"
          >
            <KeyRound className="mr-2 size-4" />
            Change password
          </button>
        </div>
      </div>

      {isOpen ? (
        <ChangePasswordModal
          onClose={() => setIsOpen(false)}
          onSuccess={(message) => {
            setIsOpen(false);
            setToastMessage(message);
          }}
        />
      ) : null}

      {toastMessage ? <SuccessToast message={toastMessage} onDone={() => setToastMessage(null)} /> : null}
    </>
  );
}

function ChangePasswordModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ChangePasswordFormState>(INITIAL_CHANGE_PASSWORD_STATE);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setIsPending(true);

    try {
      const result = await changePasswordAction(INITIAL_CHANGE_PASSWORD_STATE, formData);

      setState(result);

      if (result.success) {
        formRef.current?.reset();
        onSuccess(result.success);
      }
    } finally {
      setIsPending(false);
    }
  }

  return createPortal(
    <div className="account-dialog-overlay-enter fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(5,6,10,0.78)] px-4 py-8 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="account-dialog-panel-enter w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#090a0e] p-6 shadow-[0_40px_140px_rgba(0,0,0,0.7)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
              Account security
            </p>
            <h3
              id="change-password-title"
              className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50"
            >
              Change Password
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300 sm:text-base">
              Enter your current password and choose a new one.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X className="size-4" />
            <span className="sr-only">Close change password dialog</span>
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium text-zinc-100">
              Current Password
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your current password"
              className="h-14 rounded-2xl border-white/12 bg-white/[0.04] text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-zinc-100">
              New Password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Enter your new password"
              className="h-14 rounded-2xl border-white/12 bg-white/[0.04] text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-100">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter your new password"
              className="h-14 rounded-2xl border-white/12 bg-white/[0.04] text-white placeholder:text-zinc-500"
            />
          </div>

          {state.error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {state.success}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-zinc-500">
              Use at least {PASSWORD_RESET_MIN_PASSWORD_LENGTH} characters.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-white/12 bg-white/[0.03] px-5 text-zinc-100 hover:bg-white/[0.08] hover:text-white"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-2xl bg-white px-5 text-black hover:bg-zinc-200"
                disabled={isPending}
              >
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Change Password
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
