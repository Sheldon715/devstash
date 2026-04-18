# Current Feature

<!-- Feature Name -->

Dashboard Stats & Sidebar Data

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Replace the remaining mock dashboard stats with live data from the Neon database via Prisma while keeping the current layout and design
- Display system item types in the sidebar with their icons and counts from the database, linking each type to `/items/[typename]`
- Display actual collection data in the sidebar from the database
- Add a `View all collections` link under the sidebar collections list that goes to `/collections`
- Keep star icons for favorite collections in the sidebar
- Show a colored circle for recent collections based on the most-used item type in each collection
- Reuse and extend the existing database helper pattern, using `src/lib/db/collections.ts` as a reference where needed

## Todo List

<!-- Feature-specific checklist -->

- [x] Document the dashboard stats and sidebar feature in the current feature file
- [x] Review the current dashboard stats, sidebar UI, and related Prisma queries
- [x] Add or extend database helpers for live stats, sidebar item types, and sidebar collections
- [x] Replace sidebar mock item types with Prisma-backed system item types and counts
- [x] Replace sidebar mock collections with database-backed favorite and recent collections
- [x] Add the `/collections` link under the sidebar collections list
- [x] Keep favorite collection stars and add dominant-type colored circles for recent collections
- [x] Ensure the main dashboard stats display live database data
- [x] Run `npm run build` and fix any issues
- [x] Verify the updated stats and sidebar in the browser against the seeded data

## Notes

<!-- Any extra notes -->

- Use Prisma/Neon data instead of `@src/lib/mock-data.ts` for the main dashboard stats and the sidebar item type and collection sections
- Keep the current dashboard and sidebar layout/design unless small data-driven adjustments are needed
- Item type links in the sidebar should go to `/items/[typename]`
- Add a `View all collections` link beneath the sidebar collection groups that routes to `/collections`
- Favorite collections keep their star treatment; recent collections should use a colored dot based on the collection's dominant item type
- Reference `@src/lib/db/collections.ts` when shaping new helper logic
- Create or extend `@src/lib/db/items.ts` as needed for the live item type and stats queries

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
