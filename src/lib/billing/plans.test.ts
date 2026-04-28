import { afterEach, describe, expect, it } from "vitest";

import { BillingConfigurationError, getStripePriceId } from "@/lib/billing/plans";

describe("billing plans", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses the preferred Pro monthly and yearly Stripe price env vars", () => {
    process.env = {
      ...originalEnv,
      STRIPE_PRO_MONTHLY_PRICE_ID: "price_pro_monthly",
      STRIPE_PRO_YEARLY_PRICE_ID: "price_pro_yearly",
    };

    expect(getStripePriceId("monthly")).toBe("price_pro_monthly");
    expect(getStripePriceId("yearly")).toBe("price_pro_yearly");
  });

  it("supports the existing monthly and yearly Stripe price env var names", () => {
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID_MONTHLY: "price_monthly",
      STRIPE_PRICE_ID_YEARLY: "price_yearly",
    };
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_PRO_YEARLY_PRICE_ID;

    expect(getStripePriceId("monthly")).toBe("price_monthly");
    expect(getStripePriceId("yearly")).toBe("price_yearly");
  });

  it("throws a billing configuration error when the price is missing", () => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_PRICE_ID_MONTHLY;

    expect(() => getStripePriceId("monthly")).toThrow(BillingConfigurationError);
  });
});
