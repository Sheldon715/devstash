# Current Feature

<!-- Feature Name -->

Dashboard Collections Data

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Replace the dummy recent collections data on the dashboard with live collection data from the Neon database via Prisma
- Keep the existing dashboard card layout and visual design for the 6 recent collection cards
- Create `src/lib/db/collections.ts` with collection data-fetching helpers
- Fetch collections directly in the dashboard server component
- Derive each collection card border color from the most-used content type in that collection
- Show small icons for all item types present in each collection
- Update the collection stats display
- Do not add collection items underneath the cards yet

## Todo List

<!-- Feature-specific checklist -->

- [x] Document the dashboard collections feature in the current feature file
- [x] Review the current dashboard collections UI and Prisma schema for collection relationships
- [x] Create `src/lib/db/collections.ts` with the required dashboard collection queries
- [x] Replace mock collection data in the dashboard server component with Prisma-backed data
- [x] Derive collection border colors from the dominant content type in each collection
- [x] Show icons for each type represented in a collection
- [x] Update the collection stats display to match live data
- [x] Run `npm run build` and fix any issues
- [x] Verify dashboard collections in the browser against the seeded data

## Notes

<!-- Any extra notes -->

- The recent collections section should continue to show 6 cards in the existing design
- Use Prisma/Neon data instead of `@src/lib/mock-data.ts` for the main dashboard collections area
- Do not implement the nested collection items under the cards in this feature
- Reference `@context/screenshots/dashboard-ui-main.png` only if layout clarification is needed
- The dashboard route is now forced dynamic so build does not prerender live database queries

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
