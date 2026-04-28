# Current Feature: Stripe Integration Phase 2

## Status

In Progress

## Goals

- Add webhook-driven Stripe subscription sync for checkout and subscription lifecycle events.
- Enforce Free vs Pro limits at server boundaries for item and collection creation.
- Decide and implement upload gating or plan-aware upload limits.
- Add Settings billing UI for upgrade and subscription management.
- Wire Pro CTAs to the authenticated billing flow.
- Cover webhook sync and plan gates with focused automated tests.
- Verify the end-to-end subscription flow with Stripe CLI and Stripe test cards.

## Todo List

- [x] Create subscription sync helpers in `src/lib/billing/subscriptions.ts`.
- [x] Add Stripe webhook route for checkout and subscription events.
- [x] Add webhook route unit coverage for signatures and plan sync behavior.
- [x] Enforce Free item creation limits using existing billing usage helpers.
- [x] Enforce Free collection creation limits with friendly upgrade errors.
- [x] Choose and implement upload gating or plan-aware upload size limits.
- [x] Add Settings billing card with checkout and customer portal actions.
- [x] Update settings profile data to include billing fields.
- [x] Wire homepage/pricing Pro CTAs into the authenticated billing flow.
- [x] Run `npm run test`, `npm run lint`, and `npm run build`.
- [ ] Manually verify Stripe CLI checkout, webhook sync, portal, cancellation, and limits.

## Notes

- Spec loaded from `context/feature/stripe-integration-phase-2-spec.md`.
- Reference plan: `docs/stripe-integration-plan.md`.
- This phase depends on Stripe Phase 1 helpers, including the server Stripe client, checkout/customer portal routes, session plan state, and usage-limit utilities.
- Required webhook events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- Invoice events should be subscribed to and accepted/logged as no-op until dunning behavior is designed.
- Treat `active` and `trialing` subscription states as Pro.
- Treat deleted or canceled inactive subscriptions as Free.
- Upload decision: file/image uploads and file/image item creation are Pro-only for this phase, matching the existing Pro badges in the product UI.
- Browser verification: Settings Billing card was checked at desktop and mobile widths, and `Upgrade to Pro` now redirects to Stripe Checkout using the existing `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` env names.
- Remaining open decisions: whether `past_due` keeps temporary Pro access, and whether cancellation downgrades immediately or at period end.

## History

- Initial Next.js app scaffold created from Create Next App
- Initial framework setup completed, including project context files and boilerplate cleanup
- Dashboard UI Phase 1 completed with a `/dashboard` route, dark-mode dashboard shell, ShadCN-style UI primitives, and placeholder `Sidebar` and `Main` sections based on the phase 1 spec
- Dashboard UI Phase 2 completed with a collapsible desktop sidebar, mobile drawer trigger, type links, favorite and recent collections, and a fixed user area based on mock data
- Dashboard UI Phase 3 completed with stats cards, recent collections, pinned items, and a 10-item recent activity view using the mock dashboard dataset
- Prisma + Neon PostgreSQL setup completed with Prisma 7 config, initial schema, NextAuth models, generated client wiring, and an applied initial migration on Neon
- Development seed data feature completed with Prisma 7 seed wiring, bcrypt-based demo user creation, seeded system item types, and demo collections/items inserted into Neon
- Database demo data verification feature completed with seeded data validation, readable console summaries, and a fixed `db:test` script entry
- Dashboard collections data feature completed with Prisma-backed recent collections, live collection stats, dominant type styling, and dynamic dashboard rendering
- Dashboard items data feature completed with Prisma-backed pinned and recent items, live dashboard item stats, and server-render verification against seeded data
- Dashboard stats and sidebar data feature completed with Prisma-backed sidebar item types, live favorite/recent collections, collection navigation links, and updated seeded favorite collection data
- Add Pro Badge to Sidebar feature completed with subtle `PRO` badges for the Files and Images sidebar item types using a shared badge component
- Dashboard quick wins and low-risk hardening completed with dashboard loading and error boundaries, shared date and item-type utilities, defensive dashboard query limits, and database-side collection aggregation
- Auth Setup - NextAuth + GitHub Provider completed with Auth.js v5 GitHub auth scaffolding, Prisma adapter wiring, dashboard proxy protection, and session user ID typing; local sign-in redirect verified and live GitHub callback roundtrip still pending manual verification
- Auth Credentials - Email/Password Provider completed with Auth.js credentials login, a registration API for email/password sign-up, protected root access, and verified local registration and credentials sign-in
- Auth UI - Sign In, Register & Sign Out completed with custom auth pages, reusable avatar-driven profile/sidebar UI, working sign-out and redirect flow, polished registration success toast behavior, and a passing production build
- Email verification on register completed with Resend-powered verification emails, credentials sign-in gating until `emailVerified`, a verification callback route, and a dedicated `/verify-email` confirmation page with DevStash styling
- Email verification toggle completed with a shared `AUTH_REQUIRE_EMAIL_VERIFICATION` env flag, auto-verification when disabled, and auth UI messaging that stays aligned with the active mode
- Forgot password flow completed with request/reset pages, `VerificationToken`-backed password reset tokens, minimum password validation, sign-in recovery entry points, and passing build/lint verification; manual browser verification still pending
- Profile page completed with a protected `/profile` route, live account details and usage stats, inline password change and delete-account flows, animated sidebar and user-menu interactions, and shared success toast feedback; manual browser verification still pending
- Auth security auditor agent completed with a repo-specific Codex subagent at `.codex/agents/auth-auditor.toml`, scoped to real auth issues, report rewriting, passed checks, and NextAuth-aware false-positive guardrails
- High auth data-exposure fix completed by removing hardcoded demo-user scoping from dashboard/profile data loaders and wiring protected routes to the authenticated user's `id`
- Auth rate limiting completed with Upstash-backed auth endpoint limits, shared `429` + `Retry-After` handling, a new resend-verification flow, and passing build/lint verification; manual browser verification is still pending
- Items list view completed with a responsive `/items/[type]` grid that reuses `ItemCard`, plural type route support, improved sidebar and card hover states, bundled feature research/spec docs, and a passing production build
- Vitest unit testing setup completed with Node-based Vitest config, unit test scripts, scoped tests for server actions and utilities only, representative action/utility coverage, and updated workflow documentation
- Vitest testing workflow and responsive items layout update completed with Vitest scripts/config plus initial action and utility tests, updated testing docs, and a `/items/[type]` grid that expands to three columns on large screens
- Item drawer completed with a shared right-side lazy-loaded detail drawer on dashboard and item type pages, an authenticated `/api/items/[id]` route, utility and API route test coverage, and passing lint/test/build verification; full manual browser walkthrough is still pending
- Item drawer edit mode completed with inline Save/Cancel editing, Zod-validated item updates, ownership-safe tag replacement, refreshed drawer/card data, improved drawer layout and toast/cursor behavior, runtime Zod dependency wiring, and passing lint/test/build verification
- Item delete functionality completed with an ownership-safe delete action, Shadcn-style confirmation dialog, success/error toast feedback, refreshed drawer/list state, keyboard-safe modal handling, updated unit coverage, and passing lint/test/build verification
- Item create functionality completed with a compact animated New Item dialog, type-specific fields and placeholders, Zod-validated creation action, Prisma-backed item/tag creation, drawer type-icon polish, focused unit coverage, and passing lint/test/build verification
- Code Editor feature completed with a Monaco-powered dark CodeEditor for snippet and command display/edit/create flows, copy and language header controls, type-specific create buttons with preselected item types, file/image placeholder create support, and passing lint/test/build verification
- Markdown Editor feature completed with a GFM-enabled MarkdownEditor for notes and prompts, Write/Preview tabs, readonly previews, macOS-style header controls, dark markdown styling, and passing lint/test/build verification
- File Upload with Cloudflare R2 completed with authenticated R2 upload, download proxy, temporary upload cleanup, file/image metadata persistence, drawer previews/downloads, delete-time R2 cleanup, and focused upload/action/db test coverage
- Image Gallery View completed with image-specific thumbnail gallery cards, 16:9 cover thumbnails with hover zoom, scroll-safe image upload dialog styling, tab-close temporary upload cleanup, and passing upload route tests, lint, and production build verification
- File List View completed with a responsive `/items/files` single-column list, extension-aware file rows, direct download controls, drawer-opening row interactions, file metadata mapping coverage, and passing lint, tests, and production build verification
- Audit Quick Wins completed with safer upload response headers, SVG upload hardening, generic R2 client errors, shared email/file-size/app-origin utilities, production rate-limit configuration warning, and focused upload header test coverage
- Component Refactor Candidates completed with extracted item drawer, create dialog, sidebar, file upload, and item DB helper modules while preserving behavior and passing lint, tests, and production build verification
- Collection Create completed with an authenticated `/api/collections` create route, user-scoped collection DB helper, top-bar create collection modal with success/error toast feedback, refreshed server-rendered collection data, and passing lint/test/build verification
- Add Items To Collections completed with reusable collection selection in new/edit item forms, ownership-safe collection membership persistence, aligned selector/card/dashboard polish, focused item action/db test coverage, and passing lint/test/build verification
- Collections Pages completed with dashboard-shell `/collections`, dynamic `/collections/[id]` item grids, linked collection cards, sidebar collection links, native file/image collection sections, wider type grids, and passing lint/test/build verification
- Collection Actions completed with ownership-safe collection edit/delete actions, collection metadata edit modal, delete confirmation that preserves items, hover-revealed animated card action menus, icon-only detail actions, and passing test/lint/build verification
- Global Search / Command Palette completed with a Cmd/Ctrl+K palette, client-side grouped item and collection search, top-bar search trigger integration, item drawer and collection navigation, cmdk UI wiring, and focused search test coverage
- Pagination completed with shared pagination constants/helpers, numbered controls, server-side paged item type and collection detail queries, dashboard limit constants, and passing lint/test/build verification
- Settings Page completed with a protected `/settings` route, sidebar user-menu link, account actions moved from profile, profile type icons, aligned settings action rows, animated account dialogs, and passing lint/test/build verification
- Editor Preferences Settings completed with persisted user editor preferences, auto-saving settings controls, Monaco font/tab/wrap/minimap/theme wiring, a Prisma migration, and focused action/utility test coverage
- Favorites Page completed with a protected `/favorites` route, compact item and collection favorite lists, top-bar star navigation, drawer/navigation row interactions, favorite DB helpers, focused DB test coverage, and passing lint/build verification
- Favorite Toggle Buttons completed with authenticated item and collection favorite toggle actions, drawer and collection detail toolbar controls, passive card favorite indicators, removed decorative Favorites page header star, focused toggle tests, and passing full test/lint/build verification
- Favorites client-side sorting completed with an animated dropdown on the favorites item list, Newest/Oldest/A-Z/Z-A/type sort options, stable client-side ordering, preserved drawer row interactions, and passing test/lint/build verification
- Pinned Items completed with an authenticated item pin toggle action, optimistic drawer pin controls, pinned-first item and collection listings, static card pin indicators, focused unit coverage, and passing test/lint/build verification
- DevStash Homepage Mockup completed with a standalone `prototypes/homepage` marketing prototype, animated chaos-to-dashboard hero, responsive feature/AI/pricing/CTA/footer sections, refined visual styling, and passing lint/build verification
- Homepage completed with a public `/` marketing page, reusable homepage sections, interactive chaos/pricing components, smoother section navigation, aligned auth page styling, and passing test/lint/build verification
- Responsive Dashboard Top Bar completed with a compact mobile create menu, shrink-safe search field, reduced top-bar clutter on narrow screens, Playwright overflow verification, and passing lint/build checks
- Homepage and Dashboard UI Polish completed with tighter mobile dashboard top-bar spacing, a clearer mobile create action, reduced homepage hero height, a more product-focused dashboard preview, the Next.js smooth-scroll warning fix, Playwright desktop/mobile verification, and passing lint/build checks
- Auth Nav and Logo Polish completed with homepage navigation added to sign-in and register pages, homepage/footer/dashboard brand marks switched from initials to folder icons, and passing lint/build verification
- Stripe Integration Phase 1 completed with Stripe dependency wiring, cached server client setup, billing price and usage-limit helpers, Auth.js plan/isPro session state, authenticated checkout and customer portal routes, and passing test/lint/build verification
