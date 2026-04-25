# Current Feature: File Upload with Cloudflare R2

## Status

In Progress

## Goals

- Create upload API route for Cloudflare R2.
- Keep Prisma/database helper work inside `lib/db/items.ts`.
- Create a `FileUpload` component with drag-and-drop support.
- Update the create item modal to use `FileUpload` for file and image types.
- Delete stored R2 files when file or image items are deleted.
- Create a download proxy API route to avoid CORS issues.
- Add a download button in `ItemDrawer` for file types.
- Show upload progress while files are uploading.
- Display image previews for image items and file metadata for file items.

## Todo List

- [x] Review existing item create, drawer, delete, and database helper flows.
- [x] Add Cloudflare R2 storage configuration and upload/download/delete helpers.
- [x] Add upload API route with file/image validation and progress-compatible client contract.
- [x] Build reusable drag-and-drop `FileUpload` component.
- [x] Wire file/image creation flows to upload metadata through existing item helpers.
- [x] Delete R2 objects when file/image items are deleted.
- [x] Add download proxy API route and ItemDrawer download action.
- [x] Render image previews and file metadata in create/detail flows.
- [x] Add focused unit coverage for server-side upload/delete/download utilities where practical.
- [x] Run `npm run lint` and `npm run build`.

## Notes

- Spec source: `context/feature/file-image-spec.md`.
- Image uploads: max 5 MB; allowed extensions are `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`.
- File uploads: max 10 MB; allowed extensions are `.pdf`, `.txt`, `.md`, `.json`, `.yaml`, `.yml`, `.xml`, `.csv`, `.toml`, `.ini`.
- Allowed image MIME types: `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/svg+xml`.
- Allowed file MIME types: `application/pdf`, `text/plain`, `text/markdown`, `application/json`, `application/x-yaml`, `text/yaml`, `application/xml`, `text/xml`, `text/csv`, `application/toml`.
- Use API routes for upload/download behavior because progress tracking, files, status codes, and headers are required.
- Required R2 env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
- Optional R2 env var: `R2_PUBLIC_URL` for storing a public object URL alongside the proxy-backed item.
- The R2 helper also accepts `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, and `CLOUDFLARE_R2_PUBLIC_URL` aliases.

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
