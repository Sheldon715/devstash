# Stripe Integration Phase 1 - Core Infrastructure

## Overview

Add the Stripe billing foundation without turning on user-facing gates yet. This phase should make DevStash aware of plan state, Stripe price IDs, checkout/portal session creation, and reusable usage-limit logic. Webhooks, feature gating, and UI polish are handled in Phase 2.

Reference plan: `docs/stripe-integration-plan.md`

## Goals

- Add Stripe as a server-side dependency
- Add billing configuration helpers for monthly and yearly Pro prices
- Add reusable usage-limit helpers for Free vs Pro behavior
- Expose the user's `plan` and derived `isPro` state through Auth.js session data
- Add server routes for creating Checkout and Customer Portal sessions
- Keep all Stripe calls mockable in unit tests

## Requirements

- Install `stripe` and commit the updated `package-lock.json`
- Add Stripe env vars to the local env documentation/example if this repo has one:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET` can be documented now, but webhook handling waits for Phase 2
- Create `src/lib/stripe.ts` with a cached Stripe client and a clear missing-key error
- Create `src/lib/billing/plans.ts`:
  - Validate billing interval with Zod: `monthly` or `yearly`
  - Resolve the matching Stripe Price ID from server env vars
  - Throw a clear error when a required Price ID is missing
- Create `src/lib/billing/usage-limits.ts`:
  - Export `FREE_ITEM_LIMIT = 50`
  - Export `FREE_COLLECTION_LIMIT = 3`
  - Export a Pro-plan helper based on `plan === "PRO"`
  - Export helpers that determine whether a user can create another item or collection from plan + count inputs
  - Return structured results with a boolean and a user-facing message when blocked
- Create `src/lib/billing/usage.ts`:
  - Fetch the user's plan, total item count, and total collection count
  - Return `plan`, `isPro`, `totalItems`, and `totalCollections`
  - Use Prisma and keep the helper user-scoped
- Update `src/auth.ts`:
  - Add a `jwt` callback that refreshes the current database plan for the authenticated user
  - Keep `token.sub` aligned with `user.id`
  - Add `plan` and derived `isPro` to the session callback
- Update `src/types/next-auth.d.ts`:
  - Add `session.user.plan`
  - Add `session.user.isPro`
  - Add JWT `plan`
- Add `src/app/api/billing/create-checkout-session/route.ts`:
  - Require authentication
  - Validate the requested interval
  - Reuse an existing Stripe customer when present
  - Use `client_reference_id` and subscription metadata with the DevStash user ID
  - Return `{ success: true, data: { url } }`
- Add `src/app/api/billing/customer-portal/route.ts`:
  - Require authentication
  - Require an existing `stripeCustomerId`
  - Return `{ success: true, data: { url } }`
- Use `export const runtime = "nodejs"` for Stripe route handlers
- Do not enforce item, collection, upload, AI, custom-type, or export gates in this phase

## Files to Create

1. `src/lib/stripe.ts`
2. `src/lib/billing/plans.ts`
3. `src/lib/billing/usage-limits.ts`
4. `src/lib/billing/usage.ts`
5. `src/lib/billing/usage-limits.test.ts`
6. `src/app/api/billing/create-checkout-session/route.ts`
7. `src/app/api/billing/customer-portal/route.ts`

## Files to Modify

1. `package.json`
2. `package-lock.json`
3. `src/auth.ts`
4. `src/types/next-auth.d.ts`
5. Env documentation/example file, if present

## Optional Schema Metadata

The existing `User` model already has the minimum Stripe fields:

- `plan`
- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`

If this phase includes Settings-ready billing metadata, add:

- `stripeSubscriptionStatus`
- `stripeCurrentPeriodEnd`
- `stripeCancelAtPeriodEnd`

If schema fields are added, use Prisma migrations against the Neon `development` branch only.

## Unit Tests

Create focused Vitest coverage for `src/lib/billing/usage-limits.test.ts`:

- Free users can create an item below `50`
- Free users are blocked at `50` items
- Pro users can create beyond `50` items
- Free users can create a collection below `3`
- Free users are blocked at `3` collections
- Pro users can create beyond `3` collections
- Missing or unknown plan values behave as Free
- Blocked results return the expected user-facing message

Route tests for checkout and portal are useful, but the minimum required automated coverage for this phase is the usage-limits module.

## Testing

Run:

```bash
npm run test
npm run lint
npm run build
```

## Out of Scope

- Stripe webhook endpoint
- Subscription sync from Stripe events
- Settings billing card UI
- Homepage Pro CTA behavior changes
- Item and collection limit enforcement
- File/image upload gating
- AI, custom item type, and export gating
- Manual Stripe CLI testing

