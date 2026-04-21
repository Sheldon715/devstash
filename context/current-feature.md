# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Set up NextAuth v5 with the Prisma adapter and GitHub OAuth
- Use the split auth config pattern for edge compatibility
- Protect `/dashboard/*` with Next.js 16 proxy redirects for unauthenticated users
- Keep NextAuth default sign-in pages for initial testing
- Extend the session type so app code can rely on `session.user.id`


## Todo List

- [x] Install auth dependencies: `next-auth@beta` and `@auth/prisma-adapter`
- [x] Create the split auth configuration files in `src/auth.config.ts` and `src/auth.ts`
- [x] Add the NextAuth route handler in `src/app/api/auth/[...nextauth]/route.ts`
- [x] Add `src/proxy.ts` to protect `/dashboard/*` routes
- [x] Extend NextAuth session typing in `src/types/next-auth.d.ts`
- [x] Configure required auth environment variables for GitHub OAuth
- [ ] Verify unauthenticated access redirects to sign-in and successful auth returns to `/dashboard`

## Notes

- Use Context7 to verify the latest NextAuth v5 and adapter conventions before implementation
- Use `next-auth@beta`, not `@latest`, because `@latest` installs v4 according to the spec
- The proxy file must live at `src/proxy.ts` and use `export const proxy = auth(...)`
- Use `session: { strategy: 'jwt' }` with the split config pattern
- Do not add a custom `pages.signIn`; use NextAuth's default sign-in page for this phase
- Verified locally that unauthenticated requests to `/dashboard` redirect to `/api/auth/signin` and render a `Sign in with GitHub` button
- Full GitHub OAuth callback verification is still pending a live sign-in roundtrip
- Required environment variables:
  - `AUTH_SECRET`
  - `AUTH_GITHUB_ID`
  - `AUTH_GITHUB_SECRET`
- Reference docs:
  - `https://authjs.dev/getting-started/installation#edge-compatibility`
  - `https://authjs.dev/getting-started/adapters/prisma`

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
