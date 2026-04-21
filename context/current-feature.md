# Current Feature: Forgot Password Flow

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

- Add a "Forgot password?" entry point from the existing sign-in experience.
- Let users request a password reset email for email/password accounts.
- Use the existing `VerificationToken` Prisma model for password reset tokens instead of adding a new token table.
- Add a reset-password flow that validates the token and securely updates the stored password hash.
- Keep the UX aligned with the current DevStash auth pages, messaging, and email delivery patterns.

## Todo List

- [x] Add forgot-password and reset-password routes/forms to the auth flow.
- [x] Create password reset token helpers using the existing `VerificationToken` model.
- [x] Add server-side request/reset handling with input validation and secure password hashing.
- [x] Update the sign-in page with a forgot-password link and reset success/error messaging.
- [x] Run `npm run build`.
- [ ] Manually verify the full forgot-password flow in the browser.

## Notes

- Follow the existing auth patterns already used for credentials sign-in, registration, and email verification.
- Reuse the current email-sending approach where possible so reset emails stay consistent with the rest of the auth system.
- Keep changes minimal and focused on password reset only; avoid unrelated auth refactors.

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
