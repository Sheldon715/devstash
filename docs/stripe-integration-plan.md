# Stripe Integration Plan

Research prompt: `context/research/stripe-integration-research.md`  
Target product: DevStash Pro at `$8/month` or `$72/year`

## Source Notes

- Stripe Checkout Sessions support subscriptions by creating a server-side Checkout Session with `mode: "subscription"` and recurring `line_items`; the completed session references the Stripe Customer and Subscription. Source: https://docs.stripe.com/api/checkout/sessions and https://docs.stripe.com/payments/subscriptions
- Stripe recommends webhook-driven subscription state handling because subscription payment and lifecycle changes are asynchronous. Source: https://docs.stripe.com/billing/subscriptions/webhooks
- Stripe webhook signature verification requires the raw request body, the `Stripe-Signature` header, and the endpoint secret. Source: https://docs.stripe.com/webhooks/signature
- Stripe Billing customer portal sessions let customers manage payment methods, invoices, and subscriptions. Source: https://docs.stripe.com/billing/subscriptions/integrating-customer-portal

## Current State Analysis

### User Model

`prisma/schema.prisma` already has the subscription foundation:

```prisma
enum Plan {
  FREE
  PRO
}

model User {
  plan                 Plan    @default(FREE)
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique
  stripePriceId        String?

  @@index([plan])
}
```

There is no `isPro` field today. Use `plan === "PRO"` as the durable database source of truth. If the UI wants an `isPro` boolean, expose it as a derived session/type property rather than adding a second stored source of truth.

Useful optional fields for billing UI and webhook reconciliation:

```prisma
stripeSubscriptionStatus String?
stripeCurrentPeriodEnd   DateTime?
stripeCancelAtPeriodEnd  Boolean @default(false)
```

These are not required for basic gating, but they make Settings display and webhook debugging much better.

### Auth and Session Handling

Current auth lives in:

- `src/auth.ts`
- `src/auth.config.ts`
- `src/types/next-auth.d.ts`

The app uses Auth.js/NextAuth v5 with Prisma Adapter and `session.strategy = "jwt"`. The current `session` callback only copies `token.sub` into `session.user.id`. There is no `jwt` callback and no billing state in the session.

For Stripe webhook updates, update `src/auth.ts` so every JWT validation syncs the current database plan:

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user?.id) {
      token.sub = user.id;
    }

    if (token.sub) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { plan: true },
      });

      token.plan = dbUser?.plan ?? "FREE";
    }

    return token;
  },
  async session({ session, token }) {
    if (session.user && token.sub) {
      session.user.id = token.sub;
      session.user.plan = token.plan === "PRO" ? "PRO" : "FREE";
      session.user.isPro = session.user.plan === "PRO";
    }

    return session;
  },
}
```

Also update `src/types/next-auth.d.ts`:

```ts
import type { DefaultSession } from "next-auth";
import type { Plan } from "../../generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isPro: boolean;
      plan: Plan;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: Plan;
  }
}
```

This follows the research prompt's workaround, adapted from `isPro` to the repo's existing `Plan` enum.

### User Data Access

The protected routes and actions consistently call `auth()` and pass `session.user.id` into DB helpers:

- `src/app/dashboard/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/items/[type]/page.tsx`
- `src/actions/items.ts`
- `src/actions/collections.ts`
- `src/app/api/uploads/route.ts`
- `src/app/api/collections/route.ts`

This is a good fit for plan gating: add plan-aware helpers near the mutation boundaries and keep ownership checks inside the existing DB helpers.

### Existing Payment Code

There is no Stripe dependency in `package.json` and no existing checkout, portal, webhook, or billing action code.

Existing billing/product surfaces:

- `src/components/homepage/homepage-data.ts` has Free and Pro pricing copy.
- `src/components/homepage/pricing-section.tsx` renders a monthly/yearly toggle but Pro still links to `/register`.
- `src/components/layout/sidebar-type-links.tsx` visually marks file/image item types with `PRO`.
- `src/components/items/create-item-type-picker.tsx` visually marks file/image item types with `PRO`.
- `src/components/items/create-item-utils.ts` defines `isProItemType()` for file/image.

Those badges are informational only today. Users can still create file/image items if they upload metadata successfully.

## Feature Gating Analysis

### Free Tier Limits

Project spec says:

- Free: `50` items
- Free: `3` collections
- Pro: unlimited or higher limits

Add shared billing constants:

```ts
// src/lib/billing/limits.ts
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

export function isProPlan(plan: string | null | undefined) {
  return plan === "PRO";
}
```

### Where Counts Are Checked

Counts are not checked before creation today.

Add item limit checks in `src/actions/items.ts` before `createItemRecord()`:

```ts
const usage = await getUserBillingUsage(session.user.id);

if (!usage.isPro && usage.totalItems >= FREE_ITEM_LIMIT) {
  return {
    success: false,
    data: null,
    error: "Free workspaces can save up to 50 items. Upgrade to Pro to save more.",
  };
}
```

Add collection limit checks in `src/app/api/collections/route.ts` before `createDashboardCollection()`:

```ts
const usage = await getUserBillingUsage(session.user.id);

if (!usage.isPro && usage.totalCollections >= FREE_COLLECTION_LIMIT) {
  return NextResponse.json(
    {
      success: false,
      error: "Free workspaces can create up to 3 collections. Upgrade to Pro to create more.",
    },
    { status: 403 },
  );
}
```

Recommended helper:

```ts
// src/lib/billing/usage.ts
import { prisma } from "@/lib/prisma";

export async function getUserBillingUsage(userId: string) {
  const [user, totalItems, totalCollections] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);

  const isPro = user?.plan === "PRO";

  return {
    isPro,
    plan: user?.plan ?? "FREE",
    totalCollections,
    totalItems,
  };
}
```

### Pro-Only Features

The prompt asks to analyze Pro-only file uploads, AI, custom types, and export.

Current implementation state:

- File/image uploads exist and are functional through `src/app/api/uploads/route.ts`.
- AI fields exist on `Item` (`aiSummary`, `aiTagStatus`) but no AI routes/actions exist yet.
- Custom item types are schema-ready through nullable `ItemType.userId`, but no custom type UI/actions exist yet.
- Export does not exist yet.

Important product decision: `context/project-overview.md` says Free includes "File and image basics" while Pro includes "larger uploads". The research prompt says "file uploads" are Pro-only. Pick one before implementation.

Recommended implementation for this Stripe milestone:

- Gate item/collection quantity limits immediately.
- Gate file/image creation and upload route as Pro-only if following this prompt.
- If preserving the overview's Free file basics, leave file/image available and instead use plan-aware file size limits.
- Reserve AI/custom types/export gating until those features are implemented.

Upload gate option:

```ts
// src/app/api/uploads/route.ts
const usage = await getUserBillingUsage(session.user.id);

if (!usage.isPro) {
  return NextResponse.json(
    {
      success: false,
      error: "File and image uploads require DevStash Pro.",
    },
    { status: 403 },
  );
}
```

Also check `src/actions/items.ts` so users cannot bypass upload UI by sending existing metadata:

```ts
if (!usage.isPro && (parsedData.data.typeKey === "file" || parsedData.data.typeKey === "image")) {
  return {
    success: false,
    data: null,
    error: "File and image items require DevStash Pro.",
  };
}
```

### Settings Page Structure

Settings currently renders:

- Breadcrumb/header
- `EditorPreferencesCard`
- password/recovery/delete-account account actions

Add a billing section component:

- `src/components/settings/billing-card.tsx`
- rendered in `src/components/settings/settings-page-content.tsx`
- fed by expanded `getProfilePageData()` or a new `getBillingProfile()` helper

Use two controls:

- Upgrade/manage subscription button
- Current plan/status summary

## API and Webhook Patterns

### API Routes

Current API routes use App Router route handlers:

- `NextResponse.json(...)`
- `auth()` at the top of protected handlers
- Zod for JSON body validation
- user-friendly error strings
- `export const runtime = "nodejs"` when Node APIs are needed

Stripe webhook route should follow the upload route's Node runtime pattern:

```ts
export const runtime = "nodejs";
```

### Server Action Error Pattern

Server actions return discriminated objects:

```ts
{
  success: false,
  data: null,
  error: "Message."
}
```

Use this pattern for any billing server action, or use route handlers for redirect-oriented billing endpoints.

### Environment Variables

Existing env pattern:

- Use direct `process.env.NAME` access in small helpers.
- Throw clear errors when required server env vars are missing.
- `src/lib/app-url.ts` already normalizes public origin from `APP_URL`, `AUTH_URL`, `NEXTAUTH_URL`, or request origin.

Add:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

Optional:

```env
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

Prefer keeping Price IDs server-only unless the UI truly needs to display Stripe IDs.

## Files To Create

### `src/lib/stripe.ts`

```ts
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  if (stripe) {
    return stripe;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  stripe = new Stripe(secretKey);
  return stripe;
}
```

### `src/lib/billing/plans.ts`

```ts
import { z } from "zod";

export const billingIntervalSchema = z.enum(["monthly", "yearly"]);

export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export function getStripePriceId(interval: BillingInterval) {
  const priceId =
    interval === "monthly"
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      : process.env.STRIPE_PRO_YEARLY_PRICE_ID;

  if (!priceId) {
    throw new Error(`Missing Stripe ${interval} price ID.`);
  }

  return priceId;
}
```

### `src/lib/billing/usage.ts`

Create the helper shown in Feature Gating Analysis.

### `src/lib/billing/subscriptions.ts`

```ts
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";

const PRO_STATUSES = new Set(["active", "trialing"]);

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const stripePriceId = subscription.items.data[0]?.price.id ?? null;
  const userId = subscription.metadata.userId;

  const where = userId
    ? { id: userId }
    : { stripeCustomerId };

  await prisma.user.update({
    where,
    data: {
      plan: PRO_STATUSES.has(subscription.status) ? "PRO" : "FREE",
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      // optional if schema fields are added:
      // stripeSubscriptionStatus: subscription.status,
      // stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      // stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}
```

If not adding optional fields, omit the commented lines.

### `src/app/api/billing/create-checkout-session/route.ts`

```ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { billingIntervalSchema, getStripePriceId } from "@/lib/billing/plans";
import { getPublicAppOrigin } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { interval?: unknown } | null;
  const parsedInterval = billingIntervalSchema.safeParse(body?.interval);

  if (!parsedInterval.success) {
    return NextResponse.json(
      { success: false, error: "Choose a valid billing interval." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const origin = getPublicAppOrigin(request.url);
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
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
      userId: session.user.id,
      interval: parsedInterval.data,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
      },
    },
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/settings?checkout=cancelled`,
  });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { success: false, error: "We couldn't start checkout right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { url: checkoutSession.url },
  });
}
```

### `src/app/api/billing/customer-portal/route.ts`

```ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPublicAppOrigin } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { success: false, error: "No billing account found." },
      { status: 404 },
    );
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getPublicAppOrigin(request.url)}/settings`,
  });

  return NextResponse.json({
    success: true,
    data: { url: portalSession.url },
  });
}
```

### `src/app/api/webhooks/stripe/route.ts`

```ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { syncStripeSubscription } from "@/lib/billing/subscriptions";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const userId = checkoutSession.client_reference_id;
      const stripeCustomerId =
        typeof checkoutSession.customer === "string" ? checkoutSession.customer : null;
      const stripeSubscriptionId =
        typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : null;

      if (userId && stripeCustomerId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId,
            stripeSubscriptionId,
          },
        });
      }

      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
```

Recommended additional hardening:

- Add a `StripeWebhookEvent` table keyed by `event.id` if you want strict duplicate-event tracking.
- Fetch the subscription from Stripe inside webhook handling if an event object is missing expanded data you need.
- Decide whether `past_due` keeps Pro access temporarily or immediately downgrades. The conservative access-control default is `active` and `trialing` only.

### `src/components/settings/billing-card.tsx`

Create a client component that:

- Displays current plan.
- Lets Free users choose monthly or yearly.
- Calls `/api/billing/create-checkout-session`, then redirects to the returned URL.
- Calls `/api/billing/customer-portal` for users with `stripeCustomerId`.
- Shows loading and error states using the same visual language as settings cards.

### Tests To Create

- `src/app/api/billing/create-checkout-session/route.test.ts`
- `src/app/api/billing/customer-portal/route.test.ts`
- `src/app/api/webhooks/stripe/route.test.ts`
- `src/lib/billing/usage.test.ts`
- Update `src/actions/items.test.ts`
- Update `src/app/api/collections/route.test.ts`
- Update upload route tests if upload gating is enabled

## Files To Modify

### `package.json`

Install Stripe:

```bash
npm install stripe
```

Commit the updated `package-lock.json`.

### `prisma/schema.prisma`

Option A, minimal: no schema change needed.

Option B, better Settings visibility:

```prisma
model User {
  stripeSubscriptionStatus String?
  stripeCurrentPeriodEnd   DateTime?
  stripeCancelAtPeriodEnd  Boolean @default(false)
}
```

Then run:

```bash
npm run prisma:migrate:dev -- --name add_stripe_subscription_metadata
npm run prisma:generate
```

Use the repo's Neon safety rule: default to the `devstash` project and `development` branch only.

### `src/auth.ts`

Add the `jwt` callback and extend the `session` callback as shown above.

### `src/types/next-auth.d.ts`

Add `plan`, `isPro`, and JWT type augmentation.

### `src/components/homepage/homepage-data.ts`

Change the Pro CTA from `/register` to a post-auth billing path, for example:

```ts
href: "/settings?billing=pro"
```

If the user is not signed in, the protected route will redirect to sign-in first.

### `src/components/homepage/pricing-section.tsx`

If keeping the homepage button as a plain link, route Pro to `/settings?billing=pro`.

If starting checkout directly from the homepage, use a small client component that:

- sends unauthenticated users to `/register`
- sends authenticated users to the checkout route
- includes `monthly` or `yearly` based on the toggle

### `src/components/settings/settings-page-content.tsx`

Add `BillingCard`.

Also expand props from:

```ts
profile: Pick<ProfilePageData, "email" | "hasPassword">;
```

to include:

```ts
profile: Pick<
  ProfilePageData,
  "email" | "hasPassword" | "plan" | "stripeCustomerId" | "stripePriceId"
>;
```

### `src/lib/db/profile.ts`

Select and return billing fields:

```ts
plan: true,
stripeCustomerId: true,
stripePriceId: true,
stripeSubscriptionId: true,
```

Add optional subscription metadata if those fields are introduced.

### `src/actions/items.ts`

Add:

- Free item limit check before create.
- Pro-only upload item check if file/image is intended to be Pro-only.
- Tests for limit and Pro gating.

### `src/app/api/collections/route.ts`

Add:

- Free collection limit check before create.
- Tests for limit response.

### `src/app/api/uploads/route.ts`

If file/image uploads are Pro-only, add:

- Pro check before reading the file into a `Buffer`.
- `403` response for Free users.

If file/image basics remain Free, update `validateUploadFileMetadata()` to accept plan-aware limits instead.

### `src/components/items/create-item-dialog.tsx` and Related Create Components

Pass the current user's plan into create controls so Pro-only types can:

- show `PRO`
- disable selection for Free users, or
- allow selection but show an upgrade CTA before upload/create

The server action/API checks must remain authoritative.

## Stripe Dashboard Setup

1. Create a Stripe Product named `DevStash Pro`.
2. Create two recurring Prices:
   - Monthly: `$8 USD`, recurring monthly.
   - Yearly: `$72 USD`, recurring yearly.
3. Copy both Price IDs into env vars:
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_YEARLY_PRICE_ID`
4. Configure the Customer Portal:
   - Enable payment method updates.
   - Enable cancellation.
   - Enable subscription switching between monthly/yearly prices if desired.
   - Set branding to match DevStash.
5. Create a webhook endpoint:
   - Local: use Stripe CLI and forward to `/api/webhooks/stripe`.
   - Production: set endpoint URL to `https://your-domain.com/api/webhooks/stripe`.
6. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
7. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
8. Keep test and live keys separate. Do not use live Stripe keys in local `.env`.

## Testing Checklist

### Automated

- `npm run test`
- `npm run lint`
- `npm run build`
- Route tests:
  - unauthenticated checkout returns `401`
  - invalid interval returns `400`
  - valid monthly/yearly checkout calls Stripe with the correct Price ID
  - portal route requires `stripeCustomerId`
  - webhook rejects missing/invalid signatures
  - webhook upgrades user to `PRO` for active subscription
  - webhook downgrades user to `FREE` for deleted/canceled subscription
- Gating tests:
  - Free user at 50 items cannot create another item
  - Pro user can create beyond 50 items
  - Free user at 3 collections cannot create another collection
  - Pro user can create beyond 3 collections
  - Free upload is rejected if uploads are Pro-only

### Manual Stripe

- Start app locally on `http://localhost:3000`.
- Start Stripe CLI webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- Use a Stripe test card to complete monthly checkout.
- Confirm user record updates:
  - `plan = PRO`
  - `stripeCustomerId` set
  - `stripeSubscriptionId` set
  - `stripePriceId` matches monthly price
- Reload the app and confirm the session reflects Pro.
- Open Settings and verify Manage Billing routes to Stripe portal.
- Switch to yearly in the portal and confirm webhook updates `stripePriceId`.
- Cancel subscription and confirm downgrade timing matches the chosen policy.
- Check Free gating after downgrade.

## Implementation Order

1. Install `stripe`.
2. Add billing constants and Stripe helpers.
3. Add or skip optional subscription metadata schema fields. If adding fields, run Prisma migration and generate client.
4. Extend NextAuth JWT/session with `plan` and derived `isPro`.
5. Add checkout route.
6. Add customer portal route.
7. Add webhook route and subscription sync helper.
8. Add Settings billing UI.
9. Wire homepage Pro CTA to billing flow.
10. Add item and collection limit gates.
11. Add upload/file/image gating according to the final product decision.
12. Add tests.
13. Run `npm run test`, `npm run lint`, and `npm run build`.
14. Manually verify with Stripe CLI and test cards.

## Open Decisions

- Should Free users keep "file and image basics" from the project overview, or should all file/image uploads be Pro-only as the research prompt suggests?
- Should `past_due` keep Pro access during Stripe retry grace, or should access require only `active`/`trialing`?
- Should cancellation downgrade immediately on `customer.subscription.deleted`, or only when `cancel_at_period_end` has fully elapsed?
- Should billing be route-handler based, as planned here, or wrapped in server actions for closer alignment with item/settings mutation style?

