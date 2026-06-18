import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

import { UserAvatar } from "@/components/auth/user-avatar";
import {
  DashboardItemTypeIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import type { ProfilePageData } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

interface ProfilePageContentProps {
  profile: ProfilePageData;
  memberSinceLabel: string;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <p className="text-xs font-medium tracking-[0.22em] text-zinc-500 uppercase">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">{value}</p>
    </div>
  );
}

export function ProfilePageContent({
  profile,
  memberSinceLabel,
}: ProfilePageContentProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 text-foreground">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground">Profile</span>
        </nav>

        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090a0e] shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
          <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(251,191,36,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)] px-6 py-6 sm:px-8">
            <p className="text-sm font-medium tracking-[0.24em] text-sky-200/80 uppercase">
              Account Hub
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">
              Profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Review your DevStash identity and usage footprint.
            </p>
          </div>

          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <UserAvatar
                image={profile.image}
                name={profile.name}
                fallbackLabel={profile.email}
                className="size-20 ring-1 ring-white/12 sm:size-24"
                textClassName="text-base sm:text-lg"
              />

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                  {profile.name || profile.email}
                </h2>
                <p className="text-sm text-zinc-300 sm:text-base">{profile.email}</p>
                <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
                  Member since {memberSinceLabel}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 sm:min-w-[280px]">
              <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
                Sign-in methods
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.authProviders.map((provider) => (
                  <span
                    key={provider}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-200"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total items" value={profile.totalItems} />
          <StatCard label="Collections" value={profile.totalCollections} />
          <StatCard label="Tracked types" value={profile.itemTypeBreakdown.length} />
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1rem] bg-sky-400/10 text-sky-200">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                  Usage stats
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
                  Item type breakdown
                </h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {profile.itemTypeBreakdown.map((itemType) => (
                <div
                  key={itemType.key}
                  className="rounded-[1.35rem] border border-white/8 bg-background/50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-white/[0.04]",
                          getDashboardItemTypeColor(itemType.typeKey),
                        )}
                      >
                        <DashboardItemTypeIcon typeKey={itemType.typeKey} className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {itemType.label}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-2xl font-semibold tracking-tight text-zinc-50">
                      {itemType.count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
        </section>
      </div>
  );
}
