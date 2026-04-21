# Current Feature: Auth UI - Sign In, Register & Sign Out

## Status

In Progress

## Goals

- Replace the default Auth.js pages with a custom `/sign-in` page that supports email/password login, GitHub sign-in, validation, and friendly error states.
- Add a custom `/register` page with name, email, password, and confirm-password fields that submits to `/api/auth/register` and redirects to `/sign-in` on success.
- Update the sidebar user area to show the signed-in user's avatar, name, and a click target that links to `/profile`.
- Add a user menu on avatar interaction that exposes a working sign-out action and redirect flow.

## Todo List

- [x] Build the custom `/sign-in` page with credentials form, GitHub sign-in action, validation, and error feedback.
- [x] Build the custom `/register` page with confirm-password validation and successful redirect to `/sign-in`.
- [x] Create a reusable avatar component that renders a GitHub image when available and falls back to user initials.
- [x] Update the sidebar user area to show the avatar, user name, `/profile` navigation, and sign-out menu behavior.
- [ ] Verify GitHub sign-in, credentials sign-in, registration redirect, avatar fallback, and sign-out behavior locally.

## Notes

- Source spec: `context/feature/auth-phase-3-spec.md`
- Avatar behavior: use the GitHub `image` when present; otherwise derive initials from the user's name, such as `Brad Traversy` -> `BT`.
- The avatar component should be reusable so the same image-or-initials logic stays consistent anywhere user identity is shown.
- Manual verification for this phase should cover `/sign-in`, `/register`, GitHub auth, credentials auth, avatar rendering, `/profile` navigation, and sign-out redirect behavior.
- `npm run build` passed after wiring the custom auth routes, pages, sidebar session UI, and profile route.

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
