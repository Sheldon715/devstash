# Current Feature

<!-- Feature Name -->

Dashboard Items Data

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Replace the dummy item data displayed in the main area of the dashboard with live data from the Neon database via Prisma
- Keep the existing pinned and recent item card layout and visual design on the right side of the dashboard
- Create `src/lib/db/items.ts` with item data-fetching helpers
- Fetch pinned and recent items directly in the dashboard server component
- Derive each item card icon and border styling from the item type
- Display item type tags and preserve the existing item card details
- Update the collection stats display
- If there are no pinned items, do not render the pinned items section

## Todo List

<!-- Feature-specific checklist -->

- [x] Document the dashboard items feature in the current feature file
- [x] Review the current pinned and recent items dashboard UI plus related Prisma schema
- [x] Create `src/lib/db/items.ts` with the required dashboard item queries
- [x] Replace mock pinned and recent item data in the dashboard server component with Prisma-backed data
- [x] Derive item icons and border styling from each item's type
- [x] Preserve item type tags and the existing card details in the live item UI
- [x] Update the collection stats display
- [x] Ensure the pinned section is hidden when there are no pinned items
- [x] Run `npm run build` and fix any issues
- [x] Verify dashboard items in the browser against the seeded data

## Notes

<!-- Any extra notes -->

- Use Prisma/Neon data instead of `@src/lib/mock-data.ts` for the pinned and recent items shown in the main dashboard area
- Keep the existing dashboard layout and design as-is unless small data-driven adjustments are needed
- If pinned items do not exist, the pinned items section should not display
- Reference `@context/screenshots/dashboard-ui-main.png` only if layout clarification is needed
- Fetch data directly in the dashboard server component
- Item card icon and border treatment should reflect each item's type

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
