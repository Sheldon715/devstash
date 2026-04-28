import { z } from "zod";

export const billingIntervalSchema = z.enum(["monthly", "yearly"]);

export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export function getStripePriceId(interval: BillingInterval) {
  const priceId =
    interval === "monthly"
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      : process.env.STRIPE_PRO_YEARLY_PRICE_ID;

  if (!priceId) {
    throw new Error(`STRIPE_PRO_${interval.toUpperCase()}_PRICE_ID is required.`);
  }

  return priceId;
}
