import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPublicAppOrigin } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

interface BillingPortalResponseBody {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<BillingPortalResponseBody>(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json<BillingPortalResponseBody>(
        {
          success: false,
          error: "No billing account found.",
        },
        { status: 404 },
      );
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getPublicAppOrigin(request.url)}/settings`,
    });

    return NextResponse.json<BillingPortalResponseBody>({
      success: true,
      data: {
        url: portalSession.url,
      },
    });
  } catch {
    return NextResponse.json<BillingPortalResponseBody>(
      {
        success: false,
        error: "We couldn't open the billing portal right now.",
      },
      { status: 500 },
    );
  }
}
