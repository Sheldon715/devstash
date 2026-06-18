import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  syncStripeCheckoutSession,
  syncStripeSubscription,
} from "@/lib/billing/subscriptions";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

interface StripeWebhookResponseBody {
  received?: boolean;
  error?: string;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json<StripeWebhookResponseBody>(
      {
        error: "Stripe webhook secret is not configured.",
      },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json<StripeWebhookResponseBody>(
      {
        error: "Missing Stripe signature.",
      },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json<StripeWebhookResponseBody>(
      {
        error: "Invalid Stripe signature.",
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncStripeCheckoutSession(event.data.object as Stripe.Checkout.Session, stripe);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch {
    return NextResponse.json<StripeWebhookResponseBody>(
      {
        error: "Stripe webhook handler failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json<StripeWebhookResponseBody>({
    received: true,
  });
}
