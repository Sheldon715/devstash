# Current Feature: Auth Credentials - Email/Password Provider

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

- Add email/password authentication using the Auth.js Credentials provider.
- Use `bcryptjs` for password hashing and password verification.
- Add a persisted password field to the `User` model if the schema does not already support it.
- Add the Credentials provider placeholder in `auth.config.ts` and implement real bcrypt validation in `auth.ts`.
- Create a registration endpoint at `POST /api/auth/register` for new user sign-up.

## Todo List

- [x] Confirm the current auth setup, Prisma schema, and whether the `User` model already has a password field.
- [x] Add and apply a Prisma migration for password-based auth if the schema still needs it.
- [x] Add the Credentials provider placeholder to `auth.config.ts`.
- [x] Override the Credentials provider in `auth.ts` with bcrypt-based email/password validation.
- [x] Implement `POST /api/auth/register` with request validation, duplicate-user protection, and hashed password storage.
- [x] Verify sign-up and email/password sign-in flow locally.
- [x] Run `npm run build` and fix any issues before considering the feature ready for review.

## Notes

### Source Spec
- Loaded from [auth-phase-2-spec.md](feature/auth-phase-2-spec.md)

### Implementation Notes
- Use the split Auth.js pattern described in the spec:
  - `auth.config.ts` should include the Credentials provider with `authorize: () => null`.
  - `auth.ts` should override that provider with the real bcrypt-backed `authorize` implementation.
- The Prisma schema already includes `User.passwordHash`, so no new phase 2 schema migration was needed.
- The registration route should accept `name`, `email`, `password`, and `confirmPassword`.
- The route must validate matching passwords, reject duplicate emails, hash the password with `bcryptjs`, and return a success or error response.

### Verification Targets
- Test registration against `POST /api/auth/register`.
- Verify email/password sign-in through `/api/auth/signin`.
- Confirm successful redirect to `/dashboard`.
- Re-check that GitHub OAuth still works after the Credentials provider is added.

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
