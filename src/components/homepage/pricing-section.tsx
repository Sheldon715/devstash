"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";

import { pricingPlans } from "@/components/homepage/homepage-data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const yearlyPlan = pricingPlans.find((plan) => plan.yearlyPrice);
  const yearlySavingsPercent = yearlyPlan ? getYearlySavingsPercent(yearlyPlan) : null;

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-y border-white/8 bg-[linear-gradient(180deg,rgba(16,20,38,0.42),rgba(5,6,15,0.78))] px-4 py-20 sm:px-6 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-extrabold tracking-[0.14em] text-violet-200 uppercase">
            Simple pricing
          </p>
          <h2 className="text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
            Start free, upgrade when your stash grows
          </h2>
          <label className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-zinc-400">
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
                isYearly && yearlySavingsPercent
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0",
              )}
            >
              {yearlySavingsPercent ? `Save ${yearlySavingsPercent}%` : null}
            </span>
          </label>
        </div>

        <div className="grid justify-center gap-4 md:grid-cols-[repeat(2,minmax(0,360px))]">
          {pricingPlans.map((plan) => {
            const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;
            const term = plan.name === "Free" ? "" : isYearly ? "/yr" : "/mo";
            const savingsPercent = getYearlySavingsPercent(plan);
            const savingsLabel =
              isYearly && savingsPercent ? `Save ${savingsPercent}% vs monthly` : null;

            return (
              <article
                key={plan.name}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(99,102,241,0.1),transparent_38%),linear-gradient(180deg,rgba(13,16,32,0.96),rgba(8,10,22,0.93))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-white/18 hover:bg-[linear-gradient(145deg,rgba(99,102,241,0.16),transparent_40%),linear-gradient(180deg,rgba(16,19,40,0.98),rgba(9,12,26,0.95))] hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)]",
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
                <h3 className="text-xl font-black text-zinc-50">{plan.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">
                  {plan.description}
                </p>

                <ul className="mt-6 grid gap-2.5">
                  {plan.features.map((feature) => {
                    const Icon = feature.included ? Check : X;

                    return (
                      <li
                        key={feature.label}
                        className={cn(
                          "flex items-start gap-3 text-sm",
                          feature.included ? "text-zinc-200" : "text-zinc-500",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center",
                            feature.included
                              ? "text-[#e7d5ad]"
                              : "text-zinc-500",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        <span>{feature.label}</span>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-7 text-5xl font-black tracking-tight text-zinc-50">
                  {price}
                  <small className="ml-1 text-base font-bold text-zinc-400">{term}</small>
                </p>
                <p
                  aria-live="polite"
                  className={cn(
                    "mt-3 min-h-5 text-sm font-bold transition-colors duration-200",
                    savingsLabel ? "text-emerald-200" : "text-transparent",
                  )}
                >
                  {savingsLabel ?? ""}
                </p>
                <Link
                  href={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: plan.isPopular ? "default" : "outline",
                      size: "lg",
                    }),
                    "mt-auto w-full",
                    plan.isPopular
                      ? "bg-zinc-50 text-zinc-950 hover:bg-white"
                      : "border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06]",
                  )}
                >
                  {plan.ctaLabel}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
