# DevStash Item Types

## Overview

DevStash currently supports 7 built-in system item types:

- `snippet`
- `prompt`
- `command`
- `note`
- `file`
- `image`
- `link`

The canonical seeded definitions live in `prisma/seed.ts`. The dashboard UI currently uses `src/lib/item-types.ts` for ordering and normalization, and `src/lib/dashboard-icons.tsx` for rendered icons and colors.

One implementation detail worth documenting up front: the research prompt references `src/lib/constants.tsx`, but the live codebase now stores this logic across `src/lib/item-types.ts` and `src/lib/dashboard-icons.tsx`.

## Classification Summary

| Type | Key | Content mode | Primary content field |
|---|---|---|---|
| Snippet | `snippet` | `TEXT` | `content` |
| Prompt | `prompt` | `TEXT` | `content` |
| Command | `command` | `TEXT` | `content` |
| Note | `note` | `TEXT` | `content` |
| File | `file` | `FILE` | `fileUrl` and file metadata |
| Image | `image` | `FILE` | `fileUrl` and file metadata |
| Link | `link` | `URL` | `url` |

## Shared Item Model

All item types use the same `Item` model in `prisma/schema.prisma`, so they all share:

- Ownership and identity: `id`, `userId`, `typeId`
- Core metadata: `title`, `description`, `contentMode`
- Organization: tags through `ItemTag`, collections through `CollectionItem`
- UI state: `isFavorite`, `isPinned`, `lastAccessedAt`
- AI metadata: `aiSummary`, `aiTagStatus`
- Timestamps: `createdAt`, `updatedAt`

Optional content fields are activated by type:

- Text-oriented items use `content`, with optional `language`
- File-oriented items use `fileUrl`, `fileKey`, `fileName`, `fileMimeType`, `fileSizeBytes`
- URL-oriented items use `url`

## Type Reference

| Name | Key | Stored icon | Stored hex color | Purpose | Key fields used |
|---|---|---|---|---|---|
| Snippet | `snippet` | `Code` | `#3b82f6` | Save reusable code examples and typed implementation patterns. | Shared fields, `content`, optional `language` |
| Prompt | `prompt` | `Sparkles` | `#8b5cf6` | Store reusable AI instructions and workflow prompts. | Shared fields, `content` |
| Command | `command` | `Terminal` | `#f97316` | Save shell commands, deployment steps, and command sequences. | Shared fields, `content` |
| Note | `note` | `StickyNote` | `#fde047` | Capture general written reference material that is not code or a URL. | Shared fields, `content` |
| File | `file` | `File` | `#6b7280` | Represent uploaded non-image files such as docs, archives, or attachments. | Shared fields, `fileUrl`, `fileKey`, `fileName`, `fileMimeType`, `fileSizeBytes` |
| Image | `image` | `Image` | `#ec4899` | Represent uploaded image assets. | Shared fields, `fileUrl`, `fileKey`, `fileName`, `fileMimeType`, `fileSizeBytes` |
| Link | `link` | `Link` | `#10b981` | Save external URLs and references. | Shared fields, `url` |

## Display Differences In The Current UI

The dashboard does not render directly from the stored `ItemType.color` field. Instead, it uses hardcoded UI mappings in `src/lib/dashboard-icons.tsx`.

### Rendered colors

| Type | Current dashboard color |
|---|---|
| `snippet` | `#3b82f6` |
| `prompt` | `#8b5cf6` |
| `command` | `#f97316` |
| `note` | `#fde047` |
| `file` | `#94a3b8` |
| `image` | `#ec4899` |
| `link` | `#14b8a6` |

`file` and `link` currently differ from the seeded database colors.

### Rendered icons

There are also two icon paths in the UI:

- Type-key icons used in item cards:
  `snippet -> Code2`, `prompt -> Sparkles`, `command -> TerminalSquare`, `note -> FileText`, `file -> FolderOpen`, `image -> ImageIcon`, `link -> Link2`
- Name-based icons used when rendering the stored `itemType.icon` value:
  `Code`, `Sparkles`, `Terminal`, `StickyNote`, `File`, `Image`, `Link`

This means some types can show different icons depending on where they are rendered:

- `note`: stored as `StickyNote`, but card-by-key rendering uses `FileText`
- `file`: stored as `File`, but card-by-key rendering uses `FolderOpen`

## Behavior Notes By Category

### Text types

`snippet`, `prompt`, `command`, and `note` all map to `ItemContentMode.TEXT`.

Current differences are mostly semantic:

- `snippet` is the only seeded type that regularly uses `language`
- `prompt`, `command`, and `note` currently rely on the same `content` field shape
- In the dashboard, these types are distinguished by label, icon, and color rather than different layouts

### File types

`file` and `image` both map to `ItemContentMode.FILE`.

Implementation notes:

- The schema is ready for file metadata storage
- The dashboard sidebar marks both `file` and `image` as `PRO`
- Current seed data defines these types but does not create example `Item` rows for them yet
- Current dashboard list pages do not display file-specific metadata such as file size or mime type

### URL types

`link` maps to `ItemContentMode.URL` and uses the `url` field.

One compatibility rule already exists in `src/lib/item-types.ts`:

- `url` is normalized to `link`

That keeps older or alternate naming aligned with the current 7-type UI model.

## Current Display Model

The current dashboard item pages and cards present all item types through one shared display shape:

- Title
- Description
- Type badge
- Tag chips
- Collection names
- Favorite and pinned indicators
- Updated date

The query layer in `src/lib/db/items.ts` does not currently surface:

- `content`
- `url`
- `language`
- file metadata fields

So item types are already classified in the data model, but the dashboard still treats them mostly as one unified card format with type-specific styling.
