import { z } from "zod";

export const billingIntervalSchema = z.enum(["monthly", "yearly"]);

export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export class BillingConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingConfigurationError";
  }
}

export function getStripePriceId(interval: BillingInterval) {
  const priceId = getStripePriceEnvValue(interval);

  if (!priceId) {
    throw new BillingConfigurationError(
      `${getStripePriceEnvNames(interval).join(" or ")} is required.`,
    );
  }

  return priceId;
}

function getStripePriceEnvValue(interval: BillingInterval) {
  const [preferredName, legacyName] = getStripePriceEnvNames(interval);

  return process.env[preferredName] ?? process.env[legacyName];
}

function getStripePriceEnvNames(interval: BillingInterval) {
  return interval === "monthly"
    ? ["STRIPE_PRO_MONTHLY_PRICE_ID", "STRIPE_PRICE_ID_MONTHLY"]
    : ["STRIPE_PRO_YEARLY_PRICE_ID", "STRIPE_PRICE_ID_YEARLY"];
}
