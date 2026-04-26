import Link from "next/link";
import { ChevronRight, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { ChangePasswordCard } from "@/components/profile/change-password-card";
import { DeleteAccountCard } from "@/components/profile/delete-account-card";
import { buttonVariants } from "@/components/ui/button";
import type { ProfilePageData } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

interface SettingsPageContentProps {
  profile: Pick<ProfilePageData, "email" | "hasPassword">;
}

export function SettingsPageContent({ profile }: SettingsPageContentProps) {
  const forgotPasswordHref = `/forgot-password?email=${encodeURIComponent(profile.email)}`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 text-foreground">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">Settings</span>
      </nav>

      <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090a0e] shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
        <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.14),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(244,114,182,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)] px-6 py-6 sm:px-8">
          <p className="text-sm font-medium tracking-[0.24em] text-sky-200/80 uppercase">
            Workspace settings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
            Manage security and account-level actions for your DevStash workspace.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-sky-400/10 text-sky-200">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-50">Signed in as</p>
                <p className="mt-2 break-all text-sm leading-6 text-zinc-300">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-amber-300/10 text-amber-200">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-50">Password access</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {profile.hasPassword
                    ? "This account has an email-password credential."
                    : "This account currently signs in through OAuth only."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1rem] bg-amber-300/10 text-amber-200">
              <KeyRound className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Account actions
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
                Password and recovery
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {profile.hasPassword ? (
              <ChangePasswordCard />
            ) : (
              <div className="account-action-row rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold text-zinc-50">Password settings</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  This account currently signs in through OAuth only, so there is no email-password credential to update.
                </p>
              </div>
            )}

            <div className="account-action-row rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-zinc-50">Forgot password</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Send a secure reset link to your account email if you need to recover access.
              </p>

              <Link
                href={forgotPasswordHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-4 h-11 rounded-2xl border-white/12 bg-white/[0.03] px-4 text-zinc-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white active:translate-y-0 active:scale-[0.98]",
                )}
              >
                <Mail className="size-4" />
                Send reset link
              </Link>
            </div>

            <DeleteAccountCard email={profile.email} />
          </div>
      </section>
    </div>
  );
}
