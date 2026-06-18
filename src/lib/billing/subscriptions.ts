import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";

const PRO_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

export function getPlanForStripeSubscription(subscription: Stripe.Subscription) {
  return PRO_SUBSCRIPTION_STATUSES.has(subscription.status) ? "PRO" : "FREE";
}

export async function syncStripeCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  const userId = checkoutSession.client_reference_id ?? checkoutSession.metadata?.userId ?? null;
  const stripeCustomerId = getStripeObjectId(checkoutSession.customer);
  const stripeSubscriptionId = getStripeObjectId(checkoutSession.subscription);

  if (userId && stripeCustomerId) {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
  }

  if (stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    await syncStripeSubscription(subscription);
  }
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const stripeCustomerId = getStripeObjectId(subscription.customer);
  const userId = subscription.metadata.userId || null;

  if (!userId && !stripeCustomerId) {
    return;
  }

  await prisma.user.updateMany({
    where: userId
      ? {
          id: userId,
        }
      : {
          OR: [
            {
              stripeCustomerId,
            },
            {
              stripeSubscriptionId: subscription.id,
            },
          ],
        },
    data: {
      plan: getPlanForStripeSubscription(subscription),
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
    },
  });
}

function getStripeObjectId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}
