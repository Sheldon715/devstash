# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Build, Test, and Development Commands
- `npm run dev`: starts the local development server at `http://localhost:3000`.
- `npm run build`: creates the production build and catches compile-time issues.
- `npm run start`: serves the built app locally after `npm run build`.
- `npm run lint`: runs ESLint with the Next.js core-web-vitals and TypeScript rules.

Use `npm install` when dependencies change. Commit the updated `package-lock.json` with any dependency edits.

## Feature Completion Preference

Do not reset, commit, or push `context/current-feature.md` at the end of a feature workflow unless I explicitly ask for that cleanup.

## Neon MCP Safety Rule

When using the Neon MCP for this repo, always default to the `devstash` project and the `development` branch.

- Project name: `devstash`
- Project ID: `cool-mud-52767939`
- Default branch name: `development`
- Default branch ID: `br-ancient-bird-anbrvgu7`
- Default database: `neondb`

Never use, modify, migrate, inspect, reset, diff against, or run SQL on the `production` branch unless I explicitly say to use production in that specific request.

- Production branch name: `production`
- Production branch ID: `br-holy-glade-an3avfxc`

If a Neon MCP action would target production by default, override it to `development`.
If the target project or branch is ambiguous, stop and ask before taking action.
