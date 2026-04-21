# Current Feature: Profile Page

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

- Create the profile page at `/profile`.
- Display user info including email, name, avatar, and account creation date.
- Show usage stats including total items, total collections, and item-type breakdown.
- Add account actions for change password and delete account with confirmation.
- Animate the user section menu so the Profile and Sign out actions reveal smoothly instead of appearing suddenly when clicked.
- Keep the dashboard sidebar visible on the profile page.
- Make the sidebar collapse interaction feel smoother, including the top sidebar icon treatment.
- Follow existing codebase patterns for auth protection, data fetching, and component structure.

## Todo List

- [x] Build the protected `/profile` page.
- [x] Render user info with GitHub avatar or generated initials fallback.
- [x] Add usage stats for items, collections, and item-type counts.
- [x] Add change-password action for email/password users only.
- [x] Add delete-account flow with confirmation protection.
- [x] Update the user section interaction so Profile and Sign out animate into view on toggle.
- [x] Keep the sidebar visible on `/profile` and smooth the collapse animation.
- [x] Refresh the two top sidebar icons to match the updated interaction.
- [x] Run `npm run build`.
- [ ] Manually verify the profile page and user-menu behavior in the browser.

## Notes

- Avatar logic should prefer the GitHub avatar when available and otherwise fall back to initials from the user name or email.
- The change-password action should only appear for credentials users, not GitHub-only accounts.
- Delete account should require confirmation to prevent accidental removal.
- The item type breakdown should cover snippets, prompts, notes, commands, links, files, and images.
- The profile route must remain protected behind authentication.
- The user-section animation should feel intentional and polished, not just a visibility toggle.
- The profile page should live inside the existing dashboard shell so the sidebar remains available there.

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
