# AI Integration Plan

Research prompt: `context/research/ai-integration-research.md`  
Target model requested: `gpt-5-nano`

## Source Notes

- The current codebase does not have the `openai` package installed yet. Add it only when implementing the feature, not during this documentation task.
- Context7 resolved the official OpenAI Node SDK as `/openai/openai-node`. Its examples recommend `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`, `client.responses.create(...)`, SDK-level request timeouts, and streaming with `stream: true`.
- Official OpenAI docs position the Responses API as the primary text-generation API for new integrations. Source: https://platform.openai.com/docs/guides/text
- Official OpenAI docs cover structured outputs for schema-constrained responses. Source: https://platform.openai.com/docs/guides/structured-outputs
- Official OpenAI docs cover streamed model output for incremental UI updates. Source: https://platform.openai.com/docs/guides/streaming-responses
- Official OpenAI docs cover prompt caching and cost optimization. Source: https://platform.openai.com/docs/guides/prompt-caching and https://platform.openai.com/docs/guides/cost-optimization
- Official OpenAI docs cover rate limits and production safety practices. Source: https://platform.openai.com/docs/guides/rate-limits and https://platform.openai.com/docs/guides/production-best-practices
- Model availability should be verified at implementation time. The official model docs checked during this research surfaced current nano-family guidance such as `gpt-5.4-nano`; this plan keeps the requested `gpt-5-nano` as a configurable default but recommends an env-based fallback if that exact model ID is unavailable. Source: https://platform.openai.com/docs/models

## Current State Analysis

DevStash already has several useful foundations for AI features:

- `prisma/schema.prisma` has `Item.aiSummary` and `Item.aiTagStatus`.
- `src/actions/items.ts` has the server action style AI should follow:
  - `"use server"`
  - Zod validation
  - `auth()` session checks
  - ownership-safe DB helpers
  - `{ success, data, error }` result objects
- `src/lib/billing/usage.ts` and `src/lib/billing/usage-limits.ts` expose plan and usage data.
- `src/types/next-auth.d.ts` and `src/auth.ts` expose `session.user.plan` and `session.user.isPro`.
- `src/lib/rate-limit.ts` already wraps Upstash Redis rate limiting for auth flows. AI can reuse the same library pattern with a separate AI prefix and AI-specific scopes.
- Item detail UI already has accept/save patterns in `src/components/items/item-drawer-provider.tsx`, using loading flags, inline errors, `SuccessToast`, and `router.refresh()`.

There are no existing AI actions, AI routes, OpenAI helpers, AI usage tables, or client UI controls yet.

## Recommended Product Shape

Start with four Pro-only actions:

| Feature | Best response shape | Persistence policy |
|---|---|---|
| Auto-tagging | Structured JSON | User reviews, then accepted tags are saved |
| Summary | Structured JSON or short text | User reviews, then accepted summary can save to `Item.aiSummary` |
| Code explanation | Markdown text | Generated on demand, not saved by default |
| Prompt optimization | Structured JSON with revised prompt and notes | User reviews, then can copy or replace item content |

The core product rule should be:

- AI suggestions never silently overwrite user content.
- AI writes happen only after explicit user acceptance.
- Server-side auth, ownership, Pro gating, and rate limiting are authoritative.

## OpenAI SDK Setup

Install during implementation:

```bash
npm install openai
```

Create a small cached server-only client:

```ts
// src/lib/ai/openai.ts
import OpenAI from "openai";

const DEFAULT_AI_MODEL = "gpt-5-nano";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  cachedClient = new OpenAI({
    apiKey,
    timeout: 20_000,
    maxRetries: 2,
  });

  return cachedClient;
}

export function getAIModel() {
  return process.env.OPENAI_AI_MODEL ?? DEFAULT_AI_MODEL;
}
```

Recommended env vars:

```env
OPENAI_API_KEY=sk-...
OPENAI_AI_MODEL=gpt-5-nano
AI_RATE_LIMIT_ENABLED=true
```

If `gpt-5-nano` is not available in the target account when implementation starts, set `OPENAI_AI_MODEL` to the current nano model confirmed in the OpenAI dashboard or Models API.

## Data Access Design

Add AI-specific DB helpers instead of putting Prisma calls directly in AI actions:

```text
src/
  actions/
    ai.ts
    ai.test.ts
  lib/
    ai/
      openai.ts
      prompts.ts
      schemas.ts
      service.ts
      rate-limit.ts
    db/
      ai.ts
```

`src/lib/db/ai.ts` should provide:

- `getAIItemInput(userId, itemId)`
- `saveItemAISummary(userId, itemId, summary)`
- `replaceItemTags(userId, itemId, tags)`
- optional `replaceItemContent(userId, itemId, content)` for accepted prompt optimization

These helpers should always scope by `userId` and `itemId` together, matching the ownership pattern in `src/lib/db/items.ts`.

## Server Action Patterns

Prefer server actions for non-streaming AI calls because they fit the current item drawer workflow.

Recommended action exports:

```ts
export async function suggestItemTags(itemId: string): Promise<SuggestTagsResult>;
export async function generateItemSummary(itemId: string): Promise<GenerateSummaryResult>;
export async function explainItemCode(itemId: string): Promise<ExplainCodeResult>;
export async function optimizePromptItem(itemId: string): Promise<OptimizePromptResult>;

export async function acceptItemTags(itemId: string, tags: unknown): Promise<AcceptTagsResult>;
export async function acceptItemSummary(itemId: string, summary: unknown): Promise<AcceptSummaryResult>;
export async function acceptPromptOptimization(itemId: string, content: unknown): Promise<AcceptPromptResult>;
```

Each action should follow this order:

1. Validate `itemId` and any user input with Zod.
2. Call `auth()` and require `session.user.id`.
3. Require `session.user.isPro`.
4. Check AI rate limits.
5. Load the item through an ownership-scoped DB helper.
6. Reject unsupported item types early.
7. Build compact model input.
8. Call OpenAI.
9. Validate the model response against a Zod schema.
10. Return a suggestion object without saving, unless the action is an explicit accept action.

Recommended failure shape:

```ts
{
  success: false,
  data: null,
  error: "We couldn't generate suggestions right now."
}
```

Avoid returning raw OpenAI error messages to the client.

## Structured Outputs

Use structured outputs for auto-tagging, summaries, and prompt optimization because those features need predictable UI fields.

Recommended schemas:

```ts
// src/lib/ai/schemas.ts
import { z } from "zod";

export const aiTagSuggestionSchema = z.object({
  tags: z
    .array(z.string().trim().min(1).max(32))
    .min(1)
    .max(8)
    .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]),
});

export const aiSummarySchema = z.object({
  summary: z.string().trim().min(1).max(600),
});

export const aiCodeExplanationSchema = z.object({
  explanation: z.string().trim().min(1).max(4000),
});

export const aiPromptOptimizationSchema = z.object({
  optimizedPrompt: z.string().trim().min(1).max(8000),
  changes: z.array(z.string().trim().min(1).max(240)).max(8),
});
```

With the Responses API, keep the prompt explicit about JSON shape and still validate the returned data locally. If the SDK helper supports Zod parsing for the chosen Responses flow at implementation time, use that. Otherwise, request JSON and parse with `JSON.parse` plus Zod.

## Prompt Design

Keep prompts compact and domain-specific. Reuse stable instructions to benefit from prompt caching.

Example auto-tag instruction:

```ts
export const AUTO_TAG_INSTRUCTIONS = `
You generate short developer-knowledge tags for DevStash items.
Return only JSON matching the requested schema.
Use lowercase tags.
Prefer specific technologies, domains, and workflows.
Do not include private identifiers, secrets, emails, or access tokens.
`;
```

Example input shape:

```ts
{
  itemType: item.typeKey,
  title: item.title,
  description: item.description,
  language: item.language,
  content: truncateForAI(item.content ?? item.url ?? item.fileName ?? "", 6000),
  existingTags: item.tags.map((tag) => tag.name),
}
```

Do not send full file contents in v1. For file and image items, use metadata only unless a later file-ingestion feature extracts text safely.

## Streaming vs Non-Streaming

Use non-streaming server actions for:

- auto-tagging
- short summaries
- prompt optimization suggestion objects

Reasons:

- simpler action/result pattern
- easier schema validation
- easier accept/reject UI
- lower implementation risk

Use streaming route handlers for:

- long code explanations
- future chat-style assistant panels
- any UI where partial text materially improves perceived speed

Streaming should live in route handlers, not server actions:

```text
src/app/api/ai/explain-code/route.ts
```

Route handler requirements:

- `export const runtime = "nodejs"`
- call `auth()`
- require Pro
- validate body with Zod
- check item ownership
- check AI rate limit
- return a streamed response
- abort cleanly when the request is canceled

For the first AI milestone, non-streaming is enough. Add streaming only if code explanations feel too slow or too long.

## Pro Gating

AI should be Pro-only, consistent with the product overview and current billing surface.

Server-side gates should use the session-derived value:

```ts
const session = await auth();

if (!session?.user?.id) {
  return {
    success: false,
    data: null,
    error: "You need to be signed in to use AI tools.",
  };
}

if (!session.user.isPro) {
  return {
    success: false,
    data: null,
    error: "AI tools require DevStash Pro.",
  };
}
```

UI should also hide or disable AI controls for Free users, but that is only convenience. The action/route checks remain authoritative.

Recommended Free UI behavior:

- show a small `PRO` badge on AI buttons
- route upgrade clicks to `/upgrade`
- keep AI buttons out of destructive flows like delete confirmations

## AI Rate Limiting

Create a separate limiter instead of mixing AI with auth scopes.

Suggested scopes:

| Scope | Limit |
|---|---:|
| `suggestTags` | 20 per hour |
| `summarize` | 20 per hour |
| `explainCode` | 10 per hour |
| `optimizePrompt` | 10 per hour |

Suggested key strategy:

- primary key: `userId`
- optional secondary key: `userId:itemId` for expensive repeated item actions

Implementation should mirror `src/lib/rate-limit.ts`:

- Upstash Redis from env
- local development allowed when Redis is missing
- production warning if disabled
- short timeout so Redis issues do not hang the app
- friendly retry message

Unlike auth, AI cost can be real money. For production, prefer fail-closed for AI when Redis is required but missing. If the app needs a softer launch, allow requests only in local development and fail with "AI rate limiting is not configured" in production.

## Cost Optimization

Use the requested nano model for these features because the tasks are short, structured, and latency-sensitive.

Recommended controls:

- Put model name in `OPENAI_AI_MODEL`.
- Truncate item content before sending it.
- Use separate maximum lengths per feature:
  - tags: 4,000 to 6,000 chars
  - summary: 8,000 chars
  - code explanation: 12,000 chars
  - prompt optimization: 8,000 chars
- Do not send file binaries or image bytes in v1.
- Reuse stable `instructions` strings.
- Cache accepted outputs on the item where appropriate:
  - `aiSummary`
  - `aiTagStatus`
- Add a "Regenerate" action only when needed, not automatically on every drawer open.
- Consider storing lightweight AI usage later:
  - userId
  - itemId
  - feature
  - model
  - input/output token counts when returned by the API
  - createdAt

Recommended v1 cache policy:

- Summary: if `aiSummary` exists, show it and let the user regenerate manually.
- Tags: no auto-cache needed; accepted tags become regular tags.
- Code explanation: do not persist by default.
- Prompt optimization: do not persist unless accepted as item content.

## UI Patterns

Put AI controls in the item drawer action area or a compact "AI" section in the drawer body.

Recommended controls:

- `Suggest tags`
- `Summarize`
- `Explain code` for snippets and commands only
- `Optimize prompt` for prompt items only

Use existing UI patterns:

- `LoaderCircle` while pending
- inline error blocks inside the drawer
- `SuccessToast` after accepting suggestions
- `router.refresh()` after accepted writes
- disabled buttons while a request is pending

Recommended suggestion states:

```ts
type AISuggestionState =
  | { status: "idle" }
  | { status: "loading"; feature: AIFeature }
  | { status: "error"; message: string }
  | { status: "ready"; feature: AIFeature; data: unknown };
```

Accept/reject behavior:

- Suggestions appear in a bordered drawer section.
- `Accept` persists or applies the result.
- `Reject` clears the suggestion without saving.
- `Copy` is useful for code explanations and optimized prompts.
- "Replace content" should be explicit for prompt optimization.

Avoid running AI automatically on drawer open. That creates surprise cost and noisy UI.

## Security Considerations

API key handling:

- Keep `OPENAI_API_KEY` server-only.
- Do not expose OpenAI calls from client components.
- Do not add `NEXT_PUBLIC_OPENAI_*` env vars.

Authorization:

- Require `auth()`.
- Scope every item lookup by `session.user.id`.
- Keep Pro gates in server actions and route handlers.

Input safety:

- Validate every action input with Zod.
- Trim and cap user-provided fields before sending to OpenAI.
- Strip or redact obvious secrets before AI calls where possible.
- Do not send uploaded file bodies or image bytes in v1.
- Do not include data from other users, collections, or search results unless explicitly needed and ownership-scoped.

Output safety:

- Validate structured responses with Zod.
- Cap output lengths before returning to the UI.
- Never execute AI-generated code or shell commands.
- Treat AI-generated tags and summaries as suggestions.
- Escape/render all text through React, not `dangerouslySetInnerHTML`.
- For markdown explanations, use the existing markdown rendering approach and avoid raw HTML.

Logging:

- Do not log full prompts, item content, user secrets, or raw OpenAI responses in production.
- Log only feature name, user ID, item ID, model, status, and coarse error class if needed.

## Feature-Specific Notes

### Auto-Tagging

Supported item types:

- snippet
- prompt
- command
- note
- link
- file/image metadata only

Return:

```ts
{
  tags: string[];
}
```

Acceptance should call a separate `acceptItemTags` action that replaces or merges tags. Recommended v1 behavior: merge accepted tags with existing tags instead of replacing all tags.

### AI-Generated Summaries

Supported item types:

- text items
- links from title, description, and URL only
- files/images from metadata only

Return:

```ts
{
  summary: string;
}
```

Acceptance should save to `Item.aiSummary`. Do not overwrite `description` automatically.

### Code Explanation

Supported item types:

- snippet
- command

Require meaningful `content`. If content is empty, return a friendly validation error.

Return:

```ts
{
  explanation: string;
}
```

Do not save by default. Offer copy.

### Prompt Optimization

Supported item types:

- prompt

Return:

```ts
{
  optimizedPrompt: string;
  changes: string[];
}
```

Acceptance should be explicit:

- copy optimized prompt
- replace item content

If replacing content, use the existing `updateItem` pattern or a focused DB helper that updates only content for an owned prompt item.

## Suggested Implementation Order

1. Install `openai`.
2. Add `src/lib/ai/openai.ts`.
3. Add AI schemas and prompt builders.
4. Add AI DB helpers.
5. Add AI rate limiting helper.
6. Add non-streaming AI server actions.
7. Add unit tests for validation, Pro gating, ownership, and action failure cases.
8. Add drawer UI controls and suggestion panels.
9. Add accept actions for tags, summaries, and prompt replacement.
10. Add optional streaming route for code explanations if needed.
11. Run `npm run test`, `npm run lint`, and `npm run build`.

## Tests To Add

Recommended unit tests:

- Free users cannot call AI actions.
- Unauthenticated users cannot call AI actions.
- Invalid item IDs fail before model calls.
- Missing owned item returns "Item not found."
- Unsupported item type returns a friendly error.
- Empty snippet/command content cannot be explained.
- Auto-tag action validates and deduplicates returned tags.
- Summary action caps long output.
- Accept-tags action merges tags without cross-user access.
- Accept-summary action saves only for owned items.
- OpenAI failures return a generic user-facing error.
- Rate-limit failures return a retry message.

Mock these boundaries:

- `auth()`
- OpenAI client
- Prisma DB helpers
- rate limiter

## Open Decisions

- Is `gpt-5-nano` definitely available in the target OpenAI account, or should implementation default to the current available nano model through `OPENAI_AI_MODEL`?
- Should AI usage have a monthly quota per Pro user, or only hourly rate limits?
- Should accepted AI summaries update only `aiSummary`, or should users be able to promote them into `description`?
- Should auto-tagging merge with existing tags or offer replace/merge choices?
- Should code explanations be persisted in a future `AIResult` table, or remain ephemeral?
- Should file contents become AI-readable after a later extraction pipeline, or should v1 stay metadata-only?
