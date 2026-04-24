# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Todo List** - Before starting implementation, add a feature-specific todo list to @context/current-feature.md. Each task must use markdown checkboxes (`- [ ]` / `- [x]`). Update the checklist as work progresses and check items off as soon as they are completed.
3. **Branch** - Create new branch for feature, fix, etc
4. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
5. **Test** - Run `npm run test`, `npm run lint`, and `npm run build`. Manual browser verification is only required when explicitly requested.
6. **Iterate** - Iterate and change things if needed
7. **Commit** - Only after build passes and everything works
8. **Merge** - Merge to main
9. **Delete Branch** - Delete branch after merge
10. **Review** - Review AI-generated code periodically and on demand.
11. Mark as completed in @context/current-feature.md and add to history


Do NOT commit without permission and until the build passes. If build fails, fix the issues first.

## Unit Testing

- Use Vitest for unit tests
- Scope unit tests to server actions and utilities only
- Do not add component tests unless explicitly requested
- Co-locate tests with the code they cover using `*.test.ts`
- Mock external boundaries like Prisma, Auth.js, `next/headers`, and network clients in server action tests

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Format commit messages with a subject line, a blank line, and dash bullets in the body when committing, for example:
  `feat: add demo seed`
  ``
  `- add Prisma seed script`
  `- add database verification`
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Codex" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
