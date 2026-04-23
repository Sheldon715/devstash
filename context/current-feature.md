# Current Feature

## Status

<!-- Not Started|In Progress|Completed -->



## Goals

<!-- Goals & requirements -->

## Todo List

<!-- Feature-specific checklist -->

## Notes

<!-- Any extra notes -->

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
