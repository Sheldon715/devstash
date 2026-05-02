import type Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  constructEventMock,
  getStripeMock,
  retrieveSubscriptionMock,
  updateManyUserMock,
  updateUserMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  getStripeMock: vi.fn(),
  retrieveSubscriptionMock: vi.fn(),
  updateManyUserMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: updateUserMock,
      updateMany: updateManyUserMock,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: getStripeMock,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

describe("POST /api/webhooks/stripe", () => {
  const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    constructEventMock.mockReset();
    getStripeMock.mockReset();
    retrieveSubscriptionMock.mockReset();
    updateManyUserMock.mockReset();
    updateUserMock.mockReset();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    getStripeMock.mockReturnValue({
      subscriptions: {
        retrieve: retrieveSubscriptionMock,
      },
      webhooks: {
        constructEvent: constructEventMock,
      },
    });
  });

  it("rejects missing signatures", async () => {
    const response = await POST(createWebhookRequest());

    await expect(response.json()).resolves.toEqual({
      error: "Missing Stripe signature.",
    });
    expect(response.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("rejects invalid signatures", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await POST(createWebhookRequest("bad-signature"));

    await expect(response.json()).resolves.toEqual({
      error: "Invalid Stripe signature.",
    });
    expect(response.status).toBe(400);
  });

  it("stores Stripe customer and subscription IDs after checkout completion", async () => {
    constructEventMock.mockReturnValue(
      createStripeEvent("checkout.session.completed", {
        id: "cs_test",
        object: "checkout.session",
        client_reference_id: "user-1",
        customer: "cus_123",
        metadata: {
          userId: "user-1",
        },
        subscription: "sub_123",
      } as unknown as Stripe.Checkout.Session),
    );
    retrieveSubscriptionMock.mockResolvedValue(createSubscription("active"));

    const response = await POST(createWebhookRequest("valid-signature"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(updateUserMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
      },
    });
    expect(updateManyUserMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        plan: "PRO",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripePriceId: "price_monthly",
      },
    });
  });

  it("upgrades users to Pro for active subscriptions", async () => {
    constructEventMock.mockReturnValue(
      createStripeEvent("customer.subscription.updated", createSubscription("active")),
    );

    const response = await POST(createWebhookRequest("valid-signature"));

    expect(response.status).toBe(200);
    expect(updateManyUserMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        plan: "PRO",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripePriceId: "price_monthly",
      },
    });
  });

  it("downgrades users to Free for deleted subscriptions", async () => {
    constructEventMock.mockReturnValue(
      createStripeEvent("customer.subscription.deleted", createSubscription("canceled")),
    );

    const response = await POST(createWebhookRequest("valid-signature"));

    expect(response.status).toBe(200);
    expect(updateManyUserMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        plan: "FREE",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripePriceId: "price_monthly",
      },
    });
  });

  it("returns success for ignored event types", async () => {
    constructEventMock.mockReturnValue(
      createStripeEvent("invoice.payment_succeeded", {
        id: "in_123",
        object: "invoice",
      } as Stripe.Invoice),
    );

    const response = await POST(createWebhookRequest("valid-signature"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(updateManyUserMock).not.toHaveBeenCalled();
  });

  afterAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
  });
});

function createWebhookRequest(signature?: string) {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (signature) {
    headers.set("stripe-signature", signature);
  }

  return new Request("http://localhost:3000/api/webhooks/stripe", {
    body: JSON.stringify({ id: "evt_test" }),
    headers,
    method: "POST",
  });
}

function createStripeEvent<TEventType extends Stripe.Event.Type>(
  type: TEventType,
  object: Stripe.Event.Data.Object,
): Stripe.Event {
  return {
    id: "evt_test",
    object: "event",
    api_version: "2025-11-17.clover",
    created: 1760000000,
    data: {
      object,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
  } as unknown as Stripe.Event;
}

function createSubscription(status: Stripe.Subscription.Status): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    customer: "cus_123",
    items: {
      object: "list",
      data: [
        {
          id: "si_123",
          object: "subscription_item",
          price: {
            id: "price_monthly",
            object: "price",
          },
        },
      ],
      has_more: false,
      url: "/v1/subscription_items",
    },
    metadata: {
      userId: "user-1",
    },
    status,
  } as unknown as Stripe.Subscription;
}
