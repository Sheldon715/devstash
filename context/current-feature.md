# Dashboard quick wins and low-risk hardening

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Address quick-win review findings with little to no behavioral risk
- Exclude auth-related work and unfinished navigation/click-handler work from this pass
- Improve dashboard resilience and maintainability without broad refactors


## Todo List

<!-- Feature-specific checklist -->

- [x] Add route-level loading state for dashboard-related pages
- [x] Add route-level error boundary with retry support for dashboard-related pages
- [x] Extract shared date formatting utility for dashboard item and collection dates
- [x] Harden dashboard item type/icon handling to avoid unsafe key assumptions
- [x] Add defensive limit validation/capping to dashboard query helpers
- [x] Remove duplicate collection fetching on the dashboard request path
- [x] Run `npm run lint`
- [x] Run `npm run build`


## Notes

<!-- Any extra notes -->

- This pass intentionally excludes authentication/user scoping changes
- This pass intentionally excludes unfinished navigation and missing click handlers
- Avoid schema changes and other higher-risk refactors unless required by one of the quick wins above


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
