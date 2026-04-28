"use client";

import { useState } from "react";
import { CreditCard, Crown, LoaderCircle } from "lucide-react";
import type { Plan } from "../../../generated/prisma/enums";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BillingInterval } from "@/lib/billing/plans";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/billing/usage-limits";
import { cn } from "@/lib/utils";

interface BillingCardProps {
  plan: Plan;
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  stripeSubscriptionId: string | null;
  totalCollections: number;
  totalItems: number;
}

interface BillingRedirectResponse {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
}

const billingIntervals: Array<{
  label: string;
  priceLabel: string;
  savingsLabel: string | null;
  value: BillingInterval;
}> = [
  {
    label: "Monthly",
    priceLabel: "$8/mo",
    savingsLabel: null,
    value: "monthly",
  },
  {
    label: "Yearly",
    priceLabel: "$72/yr",
    savingsLabel: "Save 25%",
    value: "yearly",
  },
];

export function BillingCard({
  plan,
  stripeCustomerId,
  stripePriceId,
  stripeSubscriptionId,
  totalCollections,
  totalItems,
}: BillingCardProps) {
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>("monthly");
  const [pendingAction, setPendingAction] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPro = plan === "PRO";
  const hasBillingAccount = Boolean(stripeCustomerId);
  const itemUsage = getAllowanceUsage(totalItems, FREE_ITEM_LIMIT, isPro);
  const collectionUsage = getAllowanceUsage(totalCollections, FREE_COLLECTION_LIMIT, isPro);
  const billingStatusLabel = stripeSubscriptionId
    ? "Subscription connected"
    : "No subscription";
  const selectedPlan = billingIntervals.find((interval) => interval.value === selectedInterval);

  async function startCheckout() {
    setError(null);
    setPendingAction("checkout");

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          interval: selectedInterval,
        }),
      });
      const result = (await response.json()) as BillingRedirectResponse;

      if (!response.ok || !result.success || !result.data?.url) {
        setError(result.error ?? "We couldn't start checkout right now.");
        return;
      }

      window.location.assign(result.data.url);
    } catch {
      setError("We couldn't start checkout right now.");
    } finally {
      setPendingAction(null);
    }
  }

  async function openPortal() {
    setError(null);
    setPendingAction("portal");

    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });
      const result = (await response.json()) as BillingRedirectResponse;

      if (!response.ok || !result.success || !result.data?.url) {
        setError(result.error ?? "We couldn't open the billing portal right now.");
        return;
      }

      window.location.assign(result.data.url);
    } catch {
      setError("We couldn't open the billing portal right now.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/70 bg-[linear-gradient(135deg,rgba(139,92,246,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[1rem] bg-violet-300/10 text-violet-200">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Billing
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
              Plan and allowance
            </h2>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "w-fit px-3 py-1 text-xs",
            isPro
              ? "border-violet-200/30 bg-violet-300/10 text-violet-100"
              : "border-white/12 bg-white/[0.03] text-zinc-300",
          )}
        >
          {isPro ? "Pro" : "Free"}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
        <div>
          <p className="max-w-2xl text-sm leading-6 text-zinc-300">
            {isPro
              ? "Your workspace has unlimited saved items and collections. Billing is managed securely through Stripe."
              : "Free workspaces include 50 items and 3 collections. Upgrade for unlimited space and Pro-only file and image uploads."}
          </p>

          {stripePriceId ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Active price: <span className="font-mono text-zinc-300">{stripePriceId}</span>
            </p>
          ) : (
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              {billingStatusLabel}
            </p>
          )}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <AllowanceMeter
              label="Items"
              remainingLabel={itemUsage.remainingLabel}
              used={totalItems}
              limitLabel={itemUsage.limitLabel}
              percentUsed={itemUsage.percentUsed}
              isPro={isPro}
            />
            <AllowanceMeter
              label="Collections"
              remainingLabel={collectionUsage.remainingLabel}
              used={totalCollections}
              limitLabel={collectionUsage.limitLabel}
              percentUsed={collectionUsage.percentUsed}
              isPro={isPro}
            />
          </div>
        </div>

        {isPro && hasBillingAccount ? (
          <Button
            type="button"
            onClick={openPortal}
            disabled={pendingAction !== null}
            className="h-11 rounded-2xl bg-zinc-50 px-5 text-zinc-950 hover:bg-white"
          >
            {pendingAction === "portal" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            Manage billing
          </Button>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              {billingIntervals.map((interval) => (
                <button
                  key={interval.value}
                  type="button"
                  onClick={() => setSelectedInterval(interval.value)}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-xl px-3 text-sm font-semibold text-zinc-400 transition-colors",
                    selectedInterval === interval.value && "bg-white text-zinc-950",
                  )}
                >
                  <span>{interval.label}</span>
                  {interval.savingsLabel ? (
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.12em]",
                        selectedInterval === interval.value ? "text-emerald-700" : "text-emerald-200",
                      )}
                    >
                      {interval.savingsLabel}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Pro price
              </p>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-zinc-50">
                  {selectedPlan?.priceLabel}
                </p>
                {selectedPlan?.savingsLabel ? (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-emerald-200 uppercase">
                    {selectedPlan.savingsLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              onClick={startCheckout}
              disabled={pendingAction !== null}
              className="h-11 rounded-2xl bg-zinc-50 px-5 text-zinc-950 hover:bg-white"
            >
              {pendingAction === "checkout" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Crown className="size-4" />
              )}
              Upgrade to Pro
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

interface AllowanceMeterProps {
  isPro: boolean;
  label: string;
  limitLabel: string;
  percentUsed: number;
  remainingLabel: string;
  used: number;
}

function AllowanceMeter({
  isPro,
  label,
  limitLabel,
  percentUsed,
  remainingLabel,
  used,
}: AllowanceMeterProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-50">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {used} used {isPro ? "" : `of ${limitLabel}`}
          </p>
        </div>
        <p className="text-right text-sm font-semibold text-zinc-100">{remainingLabel}</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            isPro ? "bg-violet-200" : "bg-sky-200",
            getProgressWidthClass(percentUsed),
          )}
        />
      </div>
    </div>
  );
}

function getAllowanceUsage(used: number, freeLimit: number, isPro: boolean) {
  if (isPro) {
    return {
      limitLabel: "Unlimited",
      percentUsed: 100,
      remainingLabel: "Unlimited",
    };
  }

  const remaining = Math.max(freeLimit - used, 0);

  return {
    limitLabel: String(freeLimit),
    percentUsed: Math.min(Math.round((used / freeLimit) * 100), 100),
    remainingLabel: `${remaining} left`,
  };
}

function getProgressWidthClass(percentUsed: number) {
  if (percentUsed <= 0) {
    return "w-0";
  }

  if (percentUsed <= 8) {
    return "w-1/12";
  }

  if (percentUsed <= 16) {
    return "w-1/6";
  }

  if (percentUsed <= 25) {
    return "w-1/4";
  }

  if (percentUsed <= 33) {
    return "w-1/3";
  }

  if (percentUsed <= 42) {
    return "w-5/12";
  }

  if (percentUsed <= 50) {
    return "w-1/2";
  }

  if (percentUsed <= 58) {
    return "w-7/12";
  }

  if (percentUsed <= 67) {
    return "w-2/3";
  }

  if (percentUsed <= 75) {
    return "w-3/4";
  }

  if (percentUsed <= 83) {
    return "w-5/6";
  }

  if (percentUsed <= 92) {
    return "w-11/12";
  }

  return "w-full";
}
