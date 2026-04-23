# DevStash Item CRUD Architecture

## Goal

Design a unified CRUD system for all 7 built-in item types:

- `snippet`
- `prompt`
- `command`
- `note`
- `file`
- `image`
- `link`

The design should match the repo's current conventions:

- Server components fetch directly from `src/lib/db/*`
- Mutations live in `src/actions/*`
- Client forms use `useActionState` or a small client wrapper around server actions
- The existing dynamic route is `src/app/items/[type]/page.tsx`

## Source Notes

The research prompt references two outdated sources:

- `@docs/content-types.md`
- `@src/lib/constants.tsx`

In the current repo, the live replacements are:

- `docs/item-types.md`
- `src/lib/item-types.ts`
- `src/lib/dashboard-icons.tsx`

This architecture uses the current files and the existing item data model in `prisma/schema.prisma`.

## Current State

The codebase already has the start of a unified item system:

- One shared `Item` table in Prisma
- One shared `ItemType` table that defines the 7 system types
- One dynamic type route at `/items/[type]`
- One query module at `src/lib/db/items.ts`
- Shared display components like `src/components/dashboard/item-card.tsx`

What is missing is the actual CRUD layer:

- No `src/actions/items.ts` yet
- No shared item editor form yet
- No item create/edit/delete UI yet
- Current item queries return list-card data only, not editor-ready detail records

## Recommended Architecture

Keep one unified backend flow for all item types, and push type-specific behavior to configuration and components.

### Core rule

Type-specific logic should live in:

- item type config
- field rendering components
- item preview/editor components

Type-specific logic should not live in:

- separate action files per type
- separate Prisma write paths per type
- separate routes per type

That keeps CRUD consistent while still allowing different fields for text, file, and URL items.

## Proposed File Structure

```text
src/
  actions/
    items.ts

  app/
    items/
      [type]/
        page.tsx
        loading.tsx
        error.tsx

  components/
    items/
      items-page.tsx
      items-header.tsx
      item-list.tsx
      item-list-card.tsx
      item-editor-dialog.tsx
      item-editor-form.tsx
      item-delete-dialog.tsx
      item-preview.tsx
      item-metadata-fields.tsx
      item-type-fields.tsx
      item-empty-state.tsx

  lib/
    db/
      items.ts
    item-types.ts
    item-type-config.ts
    item-schemas.ts
    item-form.ts
```

## Responsibility Split

### `src/actions/items.ts`

One server action file for all mutations.

Recommended exports:

- `createItemAction`
- `updateItemAction`
- `deleteItemAction`

Optional alternative:

- `saveItemAction` for create and update, plus `deleteItemAction`

This file should handle:

- auth check
- input parsing
- Zod validation
- type lookup from `ItemType`
- ownership checks
- Prisma writes
- collection and tag relation updates
- returning `{ success, data, error }`-style results
- `revalidatePath()` for affected item pages and dashboard pages

This file should not decide:

- which fields to show for each type
- how snippet vs prompt vs link editors look
- which icon/color to render

Those decisions belong in config and components.

### `src/lib/db/items.ts`

Keep all item reads here and call them directly from server components.

Recommended query functions:

- `getDashboardItemTypePage(userId, typeKey)`
- `getItemEditorPageData(userId, typeKey, itemId?)`
- `getItemById(userId, itemId)`
- `getItemTypeDefinition(typeKey)`
- `getItemEditorCollections(userId)`
- `getItemEditorTags(userId)`

The current file already handles listing and type-page reads. It should be extended rather than replaced.

### `src/lib/item-type-config.ts`

This should become the canonical UI/config layer for item types.

Each type config entry should define:

- `key`
- `label`
- `contentMode`
- `icon`
- `color`
- supported fields
- preview strategy
- editor title/description copy

This lets the UI adapt by type without duplicating CRUD logic.

### `src/lib/item-schemas.ts`

Use Zod to define:

- a shared base schema
- one schema per content mode or item type
- a resolver that validates against the current type

Suggested shape:

- base fields: `title`, `description`, `isFavorite`, `isPinned`, `tagIds`, `collectionIds`
- text fields: `content`, `language`
- file fields: `fileUrl`, `fileKey`, `fileName`, `fileMimeType`, `fileSizeBytes`
- URL fields: `url`

The action layer can validate with one entry point, while schemas still stay type-aware.

## `/items/[type]` Route Design

The existing route should remain the single type entry point.

### Route responsibilities

`src/app/items/[type]/page.tsx` should:

- authenticate the user
- normalize and validate the route param
- fetch page data from `src/lib/db/items.ts`
- render a shared item page shell

It should not contain:

- Prisma queries inline
- mutation logic
- per-type conditional form rules

### Suggested route flow

1. Read `params.type`
2. Normalize it through `normalizeDashboardItemTypeKey`
3. Fetch the type definition and list data from `lib/db/items.ts`
4. Render one shared page component
5. Open create/edit/delete UI using shared client components

### URL model

Keep one main dynamic route and drive item editing through search params.

Recommended examples:

- `/items/snippet`
- `/items/snippet?mode=create`
- `/items/snippet?itemId=abc123`
- `/items/snippet?itemId=abc123&mode=edit`
- `/items/snippet?itemId=abc123&mode=delete`

Why this fits the repo:

- it preserves one dynamic route per item type
- it works well with server-rendered page data
- it avoids creating separate route trees for create/edit/delete
- it matches the current modal/dialog-heavy UI style already used in profile flows

## Query and Mutation Flow

### Create

1. User opens `/items/[type]?mode=create`
2. Server page loads type definition, available collections, and tags
3. Shared editor dialog renders fields based on type config
4. Form submits to `createItemAction`
5. Action validates input and writes one `Item`
6. Action revalidates `/items/[type]`, `/dashboard`, and related pages

### Update

1. User opens `/items/[type]?itemId=...&mode=edit`
2. Server page loads the existing item plus editor support data
3. Shared editor dialog pre-fills values
4. Form submits to `updateItemAction`
5. Action validates ownership, updates shared fields, then type-specific fields
6. Action revalidates the same pages

### Delete

1. User opens a delete confirmation dialog for an item on `/items/[type]`
2. Dialog submits to `deleteItemAction`
3. Action checks ownership and deletes the item
4. Action revalidates `/items/[type]`, `/dashboard`, and any impacted collection pages

## Where Type-Specific Logic Should Live

Type-specific logic belongs in components and configuration, not in actions.

### Good examples

- `snippet` shows a language field and code-style textarea
- `prompt` shows prompt-focused copy and text helper text
- `command` uses the same text storage but different labels
- `link` shows a URL input instead of content textarea
- `file` and `image` show file metadata or upload controls

### Bad examples

- `if (type === "snippet")` branches scattered through Prisma write code
- separate `createSnippetAction`, `createPromptAction`, and `createLinkAction`
- separate page routes for `/items/snippet/new` and `/items/link/new`

The action layer should mostly care about:

- which schema applies
- which database fields are allowed

The UI layer should care about:

- labels
- field components
- preview layout
- help text

## Recommended Component Responsibilities

### `items-page.tsx`

Top-level page composition for one item type.

Responsibilities:

- render header
- render list state
- connect search param state to dialogs

### `items-header.tsx`

Type header and primary actions.

Responsibilities:

- show type name, icon, count
- render "New item" button
- optionally include future filters or search

### `item-list.tsx`

Collection of item cards for a single type.

Responsibilities:

- empty state vs populated state
- map records to reusable cards

### `item-list-card.tsx`

Shared row/card for one item.

Responsibilities:

- title
- description
- type badge
- tags
- favorite/pinned state
- entry points for preview, edit, and delete

### `item-editor-dialog.tsx`

Client wrapper for create/edit state.

Responsibilities:

- open and close behavior
- choose create vs edit action
- host the shared form

### `item-editor-form.tsx`

Shared form shell across all item types.

Responsibilities:

- common fields
- form submission state
- hidden identifiers like `itemId` and `typeKey`
- include type-specific field section

### `item-type-fields.tsx`

The main type switch point in the UI.

Responsibilities:

- render the right field group for `TEXT`, `FILE`, or `URL`
- keep type-specific field branching out of actions

This is the preferred place for small, explicit branching by type or content mode.

### `item-metadata-fields.tsx`

Shared metadata controls.

Responsibilities:

- description
- favorite/pinned toggles
- tags
- collections
- language where appropriate

### `item-preview.tsx`

Optional detail preview for the selected item.

Responsibilities:

- render read-only content differently by type
- text preview for text items
- outbound link preview for URLs
- file/image metadata preview for file items

### `item-delete-dialog.tsx`

Small focused delete confirmation.

Responsibilities:

- confirm delete
- submit to `deleteItemAction`
- show pending/error state

### `item-empty-state.tsx`

Empty list experience.

Responsibilities:

- explain the type
- offer create CTA
- keep the route useful even before items exist

## Why One Action File Works Well Here

The Prisma model already uses one `Item` table with optional fields by content mode. That makes a unified mutation layer the natural fit.

Benefits:

- one permission model
- one ownership check path
- one validation entry point
- one revalidation strategy
- easier future support for custom item types

If item-specific logic spreads into separate action files too early, the codebase will repeat the same auth, validation, relation syncing, and cache invalidation rules 7 times.

## Suggested Validation Strategy

Use one normalized form payload and validate in two stages:

1. Validate shared fields
2. Validate content-mode or type-specific fields

Example split:

- shared schema: title, description, booleans, tags, collections
- text schema: content, language
- file schema: file metadata
- URL schema: url

This keeps the server action generic while still enforcing correct required fields for each type.

## Recommended Evolution Of `src/lib/db/items.ts`

The existing file is already a good base for reads. Expand it toward three read models:

- dashboard/list model
- type page model
- editor/detail model

That avoids overloading one record shape for every screen.

Recommended interfaces:

- `DashboardItemRecord`
- `ItemTypePageRecord`
- `ItemEditorRecord`
- `ItemEditorSupportData`

This keeps card views lightweight while letting the editor fetch richer fields only when needed.

## Final Recommendation

The cleanest CRUD architecture for DevStash is:

- one dynamic route: `/items/[type]`
- one query module: `src/lib/db/items.ts`
- one mutation module: `src/actions/items.ts`
- one type config layer for labels, icons, colors, and supported fields
- one shared item editor that adapts by type

In short:

- queries stay in `lib/db`
- writes stay in `actions`
- type behavior stays in config and components
- routing stays unified around `/items/[type]`

That matches the current codebase, keeps the implementation minimal, and gives enough structure for all 7 item types without branching the feature into seven separate systems.
