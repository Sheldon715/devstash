"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, X } from "lucide-react";

import { pricingPlans } from "@/components/homepage/homepage-data";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BillingRedirectResponse {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
}

function parsePrice(price: string) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

function getYearlySavingsPercent(plan: (typeof pricingPlans)[number]) {
  if (!plan.yearlyPrice) {
    return null;
  }

  const monthlyTotal = parsePrice(plan.monthlyPrice) * 12;
  const yearlyTotal = parsePrice(plan.yearlyPrice);

  if (!monthlyTotal || !yearlyTotal || yearlyTotal >= monthlyTotal) {
    return null;
  }

  return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
}

export function UpgradePageContent() {
  const [isYearly, setIsYearly] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const yearlyPlan = pricingPlans.find((plan) => plan.yearlyPrice);
  const yearlySavingsPercent = yearlyPlan ? getYearlySavingsPercent(yearlyPlan) : null;

  async function startCheckout() {
    setError(null);
    setIsStartingCheckout(true);

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          interval: isYearly ? "yearly" : "monthly",
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
      setIsStartingCheckout(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-9 pb-3 sm:px-6 sm:pt-10 lg:px-10">
      <div className="mx-auto mb-7 max-w-3xl text-center">
        <p className="mb-3 text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase">
          Simple pricing
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
          Upgrade when your stash grows
        </h1>
        <label className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-zinc-400">
          <span>Monthly</span>
          <input
            type="checkbox"
            checked={isYearly}
            onChange={(event) => setIsYearly(event.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-7 w-13 rounded-full border border-white/12 bg-white/[0.05] transition-colors peer-checked:bg-violet-400/20 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-6" />
          <span>Yearly</span>
          <span
            aria-live="polite"
            className={cn(
              "rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-black text-emerald-200 transition-all duration-200",
              isYearly && yearlySavingsPercent ? "scale-100 opacity-100" : "scale-95 opacity-0",
            )}
          >
            {yearlySavingsPercent ? `Save ${yearlySavingsPercent}%` : null}
          </span>
        </label>

        {error ? (
          <p className="mx-auto mt-6 max-w-xl rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid justify-center gap-4 md:grid-cols-[repeat(2,minmax(0,340px))]">
        {pricingPlans.map((plan) => {
          const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;
          const term = plan.name === "Free" ? "" : isYearly ? "/yr" : "/mo";
          const savingsPercent = getYearlySavingsPercent(plan);
          const savingsLabel =
            isYearly && savingsPercent ? `Save ${savingsPercent}% vs monthly` : null;
          const isProPlan = plan.name === "Pro";

          return (
            <article
              key={plan.name}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(99,102,241,0.1),transparent_38%),linear-gradient(180deg,rgba(13,16,32,0.96),rgba(8,10,22,0.93))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-white/18 hover:bg-[linear-gradient(145deg,rgba(99,102,241,0.16),transparent_40%),linear-gradient(180deg,rgba(16,19,40,0.98),rgba(9,12,26,0.95))] hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)]",
                plan.isPopular &&
                  "border-violet-200/30 hover:border-violet-200/45 hover:shadow-[0_24px_76px_rgba(139,92,246,0.16)]",
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {plan.isPopular ? (
                <Badge
                  variant="outline"
                  className="absolute right-5 top-5 border-[#e7d5ad]/30 bg-[#e7d5ad]/10 text-[#eadbbd] transition-colors duration-300 group-hover:border-[#e7d5ad]/45 group-hover:bg-[#e7d5ad]/14"
                >
                  Most Popular
                </Badge>
              ) : null}
              <h3 className="text-lg font-black text-zinc-50">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-400">
                {plan.description}
              </p>

              <ul className="mt-4 grid gap-1.5">
                {plan.features.map((feature) => {
                  const Icon = feature.included ? Check : X;

                  return (
                    <li
                      key={feature.label}
                      className={cn(
                        "flex items-start gap-2.5 text-xs leading-5",
                        feature.included ? "text-zinc-200" : "text-zinc-500",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center",
                          feature.included ? "text-[#e7d5ad]" : "text-zinc-500",
                        )}
                      >
                        <Icon className="size-3" aria-hidden="true" />
                      </span>
                      <span>{feature.label}</span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-4 text-4xl font-black tracking-tight text-zinc-50">
                {price}
                <small className="ml-1 text-base font-bold text-zinc-400">{term}</small>
              </p>
              <p
                aria-live="polite"
                className={cn(
                  "mt-2 min-h-5 text-xs font-bold transition-colors duration-200",
                  savingsLabel ? "text-emerald-200" : "text-transparent",
                )}
              >
                {savingsLabel ?? ""}
              </p>

              {isProPlan ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => void startCheckout()}
                  disabled={isStartingCheckout}
                  className="mt-auto w-full bg-zinc-50 text-zinc-950 hover:bg-white"
                >
                  {isStartingCheckout ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Upgrade to Pro
                </Button>
              ) : (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "mt-auto w-full border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06]",
                  )}
                >
                  Current plan
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
