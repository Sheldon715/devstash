import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPublicAppOrigin } from "@/lib/app-url";
import { billingIntervalSchema, getStripePriceId } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

interface BillingCheckoutResponseBody {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<BillingCheckoutResponseBody>(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<BillingCheckoutResponseBody>(
      {
        success: false,
        error: "Choose a valid billing interval.",
      },
      { status: 400 },
    );
  }

  const parsedInterval = billingIntervalSchema.safeParse(
    typeof body === "object" && body !== null ? Reflect.get(body, "interval") : undefined,
  );

  if (!parsedInterval.success) {
    return NextResponse.json<BillingCheckoutResponseBody>(
      {
        success: false,
        error: "Choose a valid billing interval.",
      },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json<BillingCheckoutResponseBody>(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      client_reference_id: session.user.id,
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price: getStripePriceId(parsedInterval.data),
          quantity: 1,
        },
      ],
      metadata: {
        interval: parsedInterval.data,
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      success_url: `${getPublicAppOrigin(request.url)}/settings?checkout=success`,
      cancel_url: `${getPublicAppOrigin(request.url)}/settings?checkout=cancelled`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json<BillingCheckoutResponseBody>(
        {
          success: false,
          error: "We couldn't start checkout right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json<BillingCheckoutResponseBody>({
      success: true,
      data: {
        url: checkoutSession.url,
      },
    });
  } catch {
    return NextResponse.json<BillingCheckoutResponseBody>(
      {
        success: false,
        error: "We couldn't start checkout right now.",
      },
      { status: 500 },
    );
  }
}
