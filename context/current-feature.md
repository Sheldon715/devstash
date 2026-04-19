# Current Feature

<!-- Feature Name -->

Add Pro Badge to Sidebar

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Add a subtle `PRO` badge to the `Files` item type in the sidebar
- Add a subtle `PRO` badge to the `Images` item type in the sidebar
- Use the shadcn/ui `Badge` component for the sidebar badges
- Keep the existing sidebar layout and styling clean, with `PRO` rendered in uppercase

## Todo List

<!-- Feature-specific checklist -->

- [x] Document the pro badge sidebar feature in the current feature file
- [x] Review the current sidebar item type UI and badge component usage
- [x] Add `PRO` badges to the `Files` and `Images` sidebar item types
- [x] Keep the badge styling subtle and aligned with the current sidebar design
- [x] Run `npm run build` and fix any issues

## Notes

<!-- Any extra notes -->

- Source spec: `context/feature/add-pro-badge-sidebar.md`
- Scope is limited to the sidebar item type entries for `Files` and `Images`
- Preserve existing patterns and avoid unrelated sidebar refactors
- Use a clean, subtle badge treatment rather than a loud accent

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
