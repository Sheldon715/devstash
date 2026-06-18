# Stripe Integration Phase 2 - Integration and UI

## Overview

Complete the Stripe integration by syncing subscription events, enforcing Free vs Pro limits, and adding the billing UI. This phase depends on the Phase 1 billing helpers and includes manual verification with the Stripe CLI.

Reference plan: `docs/stripe-integration-plan.md`

## Goals

- Add webhook-driven subscription sync
- Enforce Free vs Pro gates at server boundaries
- Add Settings billing UI for upgrade and subscription management
- Wire Pro CTAs to the authenticated billing flow
- Verify the end-to-end flow with Stripe CLI and Stripe test cards

## Requirements

- Create `src/lib/billing/subscriptions.ts`:
  - Sync Stripe subscription state to the DevStash `User`
  - Treat `active` and `trialing` as Pro
  - Treat deleted/canceled inactive subscriptions as Free
  - Store `stripeCustomerId`, `stripeSubscriptionId`, and `stripePriceId`
  - Store optional subscription metadata if Phase 1 added those schema fields
- Create `src/app/api/webhooks/stripe/route.ts`:
  - Use `export const runtime = "nodejs"`
  - Read the raw request body with `request.text()`
  - Verify the `Stripe-Signature` header with `STRIPE_WEBHOOK_SECRET`
  - Handle `checkout.session.completed`
  - Handle `customer.subscription.created`
  - Handle `customer.subscription.updated`
  - Handle `customer.subscription.deleted`
  - Return a success response for ignored event types
- Enforce item creation limits in `src/actions/items.ts`:
  - Free users cannot create more than `50` items
  - Pro users are not blocked by the Free item limit
  - Reuse `src/lib/billing/usage-limits.ts` instead of duplicating constants/messages
- Enforce collection creation limits in `src/app/api/collections/route.ts`:
  - Free users cannot create more than `3` collections
  - Pro users are not blocked by the Free collection limit
  - Return `403` with a friendly upgrade-oriented error when blocked
- Decide and implement upload gating:
  - If file/image uploads are Pro-only, gate `src/app/api/uploads/route.ts` before reading the file body
  - Also block file/image item creation in `src/actions/items.ts`
  - If Free users keep basic file/image uploads, implement plan-aware upload size limits instead
- Keep AI, custom item type, and export gates server-authoritative when those features are introduced
- Add `src/components/settings/billing-card.tsx`:
  - Show the current plan
  - Let Free users choose monthly or yearly Pro checkout
  - Redirect to the Checkout Session URL returned by the Phase 1 route
  - Let Pro users with a Stripe customer open the Customer Portal
  - Show loading and error states consistent with the Settings page
- Update `src/components/settings/settings-page-content.tsx` to render the billing card
- Update the Settings profile data helper to select billing fields needed by the billing card
- Update homepage/pricing Pro CTAs to send users into the billing flow:
  - Unauthenticated users should still land in auth first
  - Authenticated users should be able to start checkout from Settings

## Files to Create

1. `src/lib/billing/subscriptions.ts`
2. `src/app/api/webhooks/stripe/route.ts`
3. `src/app/api/webhooks/stripe/route.test.ts`
4. `src/components/settings/billing-card.tsx`

## Files to Modify

1. `src/actions/items.ts`
2. `src/actions/items.test.ts`
3. `src/app/api/collections/route.ts`
4. `src/app/api/collections/route.test.ts`
5. `src/app/api/uploads/route.ts`, if upload gating is enabled
6. Existing upload route tests, if upload gating is enabled
7. `src/components/settings/settings-page-content.tsx`
8. `src/lib/db/profile.ts`
9. `src/components/homepage/homepage-data.ts`
10. `src/components/homepage/pricing-section.tsx`, if the CTA needs client-side checkout behavior

## Webhook Events

Subscribe the Stripe endpoint to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

The first four events are required for this phase. Invoice events can be accepted and logged/no-op until dunning behavior is designed.

## Automated Tests

- Webhook rejects missing signatures
- Webhook rejects invalid signatures
- Webhook stores Stripe customer and subscription IDs after checkout completion
- Webhook upgrades users to Pro for active subscriptions
- Webhook downgrades users to Free for deleted/canceled subscriptions
- Free user at `50` items cannot create another item
- Pro user can create beyond `50` items
- Free user at `3` collections cannot create another collection
- Pro user can create beyond `3` collections
- Free upload is rejected if uploads are Pro-only

## Manual Stripe CLI Testing

Start the app:

```bash
npm run dev
```

Forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the webhook signing secret from the CLI output as `STRIPE_WEBHOOK_SECRET`.

Verify:

- Complete monthly checkout with a Stripe test card
- Confirm the user becomes `PRO`
- Confirm `stripeCustomerId`, `stripeSubscriptionId`, and `stripePriceId` are set
- Reload the app and confirm the Auth.js session reflects Pro
- Open Settings and confirm Manage Billing redirects to the Stripe Customer Portal
- Switch from monthly to yearly in the portal, if portal switching is enabled
- Confirm the webhook updates `stripePriceId`
- Cancel the subscription
- Confirm downgrade behavior matches the chosen cancellation policy
- Confirm Free item, collection, and upload gates work after downgrade

## Testing

Run:

```bash
npm run test
npm run lint
npm run build
```

## Open Decisions

- Are file and image uploads entirely Pro-only, or do Free users keep basic upload support with lower limits?
- Does `past_due` keep temporary Pro access during Stripe retry grace, or does Pro require only `active`/`trialing`?
- Should cancellation downgrade immediately when the subscription is deleted, or only after the paid period fully ends?

