"use server";

import { z } from "zod";

import {
  actionFailure,
  actionSuccess,
  getActionUserId,
  getZodErrorMessage,
  type ActionResult,
} from "@/actions/_shared";
import { getOpenAIClient, AI_MODEL } from "@/lib/ai/openai";
import { getUserBillingUsage } from "@/lib/billing/usage";
import { checkAiRateLimit, getRateLimitErrorMessage } from "@/lib/rate-limit";

const AUTO_TAG_CONTENT_LIMIT = 2_000;
const CODE_EXPLANATION_CONTENT_LIMIT = 6_000;
const DESCRIPTION_CONTENT_LIMIT = 2_000;
const PROMPT_OPTIMIZATION_CONTENT_LIMIT = 8_000;
const GENERATED_CODE_EXPLANATION_LIMIT = 2_400;
const GENERATED_DESCRIPTION_LIMIT = 500;
const GENERATED_PROMPT_LIMIT = 8_000;
const MAX_AUTO_TAGS = 5;
const NO_USEFUL_PROMPT_UPDATE_ERROR = "No useful prompt update was generated.";

const autoTagSchema = z
  .object({
    title: z.string().trim().max(200).optional().default(""),
    description: z.string().trim().max(500).optional().nullable().default(""),
    content: z.string().trim().optional().nullable().default(""),
  })
  .refine(
    (data) => Boolean(data.title || data.description || data.content),
    "Add a title or content before suggesting tags.",
  );

const itemDescriptionSchema = z
  .object({
    title: z.string().trim().max(200).optional().default(""),
    description: z.string().trim().max(1_000).optional().nullable().default(""),
    content: z.string().trim().optional().nullable().default(""),
    itemType: z.string().trim().max(50).optional().nullable().default(""),
    url: z.string().trim().max(500).optional().nullable().default(""),
    fileName: z.string().trim().max(260).optional().nullable().default(""),
    fileMimeType: z.string().trim().max(120).optional().nullable().default(""),
  })
  .refine(
    (data) =>
      Boolean(
        data.title ||
          data.description ||
          data.content ||
          data.url ||
          data.fileName ||
          data.fileMimeType,
      ),
    "Add a title, content, URL, or file before generating a description.",
  );

const codeExplanationSchema = z
  .object({
    title: z.string().trim().max(200).optional().default(""),
    content: z.string().trim().optional().nullable().default(""),
    itemType: z.enum(["snippet", "command"], {
      error: "Code explanations are available for snippets and commands only.",
    }),
    language: z.string().trim().max(80).optional().nullable().default(""),
  })
  .refine((data) => Boolean(data.content), "Add code or a command before generating an explanation.");

const promptOptimizationSchema = z
  .object({
    title: z.string().trim().max(200).optional().default(""),
    description: z.string().trim().max(1_000).optional().nullable().default(""),
    content: z.string().trim().optional().nullable().default(""),
  })
  .refine((data) => Boolean(data.content), "Add a prompt before optimizing it.");

export type GenerateAutoTagsResult = ActionResult<{
  tags: string[];
}>;

export type GenerateItemDescriptionResult = ActionResult<{
  description: string;
}>;

export type ExplainCodeResult = ActionResult<{
  explanation: string;
}>;

export type OptimizePromptResult = ActionResult<{
  optimizedPrompt: string;
  changes: string[];
}>;

export async function generateAutoTags(data: unknown): Promise<GenerateAutoTagsResult> {
  const parsedData = autoTagSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure("You need to be signed in to suggest tags.");
  }

  const usage = await getUserBillingUsage(userId);

  if (!usage.isPro) {
    return actionFailure("AI tag suggestions require DevStash Pro.");
  }

  const rateLimitResult = await checkAiRateLimit("autoTag", userId);

  if (!rateLimitResult.success) {
    return actionFailure(getRateLimitErrorMessage(rateLimitResult.reset));
  }

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are MiMo, a developer knowledge-base assistant that suggests concise, lowercase JSON tags for developer resources.",
        },
        {
          role: "user",
          content: buildAutoTagPrompt(parsedData.data),
        },
      ],
      max_completion_tokens: 256,
      temperature: 0.3,
      top_p: 0.95,
      response_format: {
        type: "json_object",
      },
    });
    const outputText = response.choices[0]?.message?.content;

    if (!outputText) {
      return actionFailure("No useful tag suggestions were generated.");
    }

    const tags = parseAutoTagOutput(outputText);

    if (!tags.length) {
      return actionFailure("No useful tag suggestions were generated.");
    }

    return actionSuccess({
      tags,
    });
  } catch (error) {
    console.error("AI auto-tag generation failed.", error);

    return actionFailure("We couldn't suggest tags right now.");
  }
}

export async function generateItemDescription(
  data: unknown,
): Promise<GenerateItemDescriptionResult> {
  const parsedData = itemDescriptionSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure("You need to be signed in to generate descriptions.");
  }

  const usage = await getUserBillingUsage(userId);

  if (!usage.isPro) {
    return actionFailure("AI descriptions require DevStash Pro.");
  }

  const rateLimitResult = await checkAiRateLimit("descriptionSummary", userId);

  if (!rateLimitResult.success) {
    return actionFailure(getRateLimitErrorMessage(rateLimitResult.reset));
  }

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are MiMo, a developer knowledge-base assistant that writes concise item descriptions from provided inputs only.",
        },
        {
          role: "user",
          content: buildItemDescriptionPrompt(parsedData.data),
        },
      ],
      max_completion_tokens: 220,
      temperature: 0.25,
      top_p: 0.9,
      response_format: {
        type: "json_object",
      },
    });
    const outputText = response.choices[0]?.message?.content;

    if (!outputText) {
      return actionFailure("No useful description was generated.");
    }

    const description = parseItemDescriptionOutput(outputText);

    if (!description) {
      return actionFailure("No useful description was generated.");
    }

    return actionSuccess({
      description,
    });
  } catch (error) {
    console.error("AI description generation failed.", error);

    return actionFailure("We couldn't generate a description right now.");
  }
}

export async function explainCode(data: unknown): Promise<ExplainCodeResult> {
  const parsedData = codeExplanationSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure("You need to be signed in to explain code.");
  }

  const usage = await getUserBillingUsage(userId);

  if (!usage.isPro) {
    return actionFailure("AI code explanations require DevStash Pro.");
  }

  const rateLimitResult = await checkAiRateLimit("codeExplain", userId);

  if (!rateLimitResult.success) {
    return actionFailure(getRateLimitErrorMessage(rateLimitResult.reset));
  }

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are MiMo, a developer knowledge-base assistant that explains code and terminal commands clearly and concisely.",
        },
        {
          role: "user",
          content: buildCodeExplanationPrompt(parsedData.data),
        },
      ],
      max_completion_tokens: 520,
      temperature: 0.2,
      top_p: 0.9,
      response_format: {
        type: "json_object",
      },
    });
    const outputText = response.choices[0]?.message?.content;

    if (!outputText) {
      return actionFailure("No useful explanation was generated.");
    }

    const explanation = parseCodeExplanationOutput(outputText);

    if (!explanation) {
      return actionFailure("No useful explanation was generated.");
    }

    return actionSuccess({
      explanation,
    });
  } catch (error) {
    console.error("AI code explanation failed.", error);

    return actionFailure("We couldn't explain this code right now.");
  }
}

export async function optimizePrompt(data: unknown): Promise<OptimizePromptResult> {
  const parsedData = promptOptimizationSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure("You need to be signed in to optimize prompts.");
  }

  const usage = await getUserBillingUsage(userId);

  if (!usage.isPro) {
    return actionFailure("AI prompt optimization requires DevStash Pro.");
  }

  const rateLimitResult = await checkAiRateLimit("promptOptimize", userId);

  if (!rateLimitResult.success) {
    return actionFailure(getRateLimitErrorMessage(rateLimitResult.reset));
  }

  const initialResult = await requestPromptOptimization(parsedData.data);

  if (initialResult.success || initialResult.error !== NO_USEFUL_PROMPT_UPDATE_ERROR) {
    return initialResult;
  }

  const retryResult = await requestPromptOptimization(parsedData.data, 2);

  if (retryResult.success) {
    return retryResult;
  }

  if (retryResult.error !== NO_USEFUL_PROMPT_UPDATE_ERROR) {
    return retryResult;
  }

  return initialResult;
}

function buildAutoTagPrompt(data: z.infer<typeof autoTagSchema>) {
  const content = data.content ? data.content.slice(0, AUTO_TAG_CONTENT_LIMIT) : "";

  return [
    "Suggest 3-5 tags for this DevStash item.",
    "Return JSON only, using either {\"tags\":[\"tag\"]} or [\"tag\"].",
    `Title: ${data.title || "(none)"}`,
    `Description: ${data.description || "(none)"}`,
    `Content: ${content || "(none)"}`,
  ].join("\n");
}

function buildItemDescriptionPrompt(data: z.infer<typeof itemDescriptionSchema>) {
  const content = data.content ? data.content.slice(0, DESCRIPTION_CONTENT_LIMIT) : "";

  return [
    "Write a good, concise 1-2 sentence description for this DevStash item.",
    "Use only the supplied information. Do not invent details.",
    "Return JSON only, using {\"description\":\"...\"}.",
    `Item type: ${data.itemType || "(unknown)"}`,
    `Title: ${data.title || "(none)"}`,
    `Current description: ${data.description || "(none)"}`,
    `URL: ${data.url || "(none)"}`,
    `File name: ${data.fileName || "(none)"}`,
    `File MIME type: ${data.fileMimeType || "(none)"}`,
    `Content: ${content || "(none)"}`,
  ].join("\n");
}

function buildCodeExplanationPrompt(data: z.infer<typeof codeExplanationSchema>) {
  const content = data.content ? data.content.slice(0, CODE_EXPLANATION_CONTENT_LIMIT) : "";
  const itemLabel = data.itemType === "command" ? "terminal command" : "code snippet";

  return [
    `Explain this ${itemLabel} for a developer knowledge-base item.`,
    "Keep the explanation concise, roughly 200-300 words.",
    "Use markdown with short sections or bullets where helpful.",
    "Cover what it does, important flow, and key concepts or caveats.",
    "Do not invent surrounding project details.",
    "Return JSON only, using {\"explanation\":\"...\"}.",
    `Title: ${data.title || "(none)"}`,
    `Language: ${data.language || "(unknown)"}`,
    `Content:\n${content}`,
  ].join("\n");
}

async function requestPromptOptimization(
  data: z.infer<typeof promptOptimizationSchema>,
  attempt = 1,
): Promise<OptimizePromptResult> {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are MiMo, a developer knowledge-base assistant that rewrites prompts into clearly better versions. Preserve intent, but produce a genuinely improved prompt rather than a light edit or copy of the original.",
        },
        {
          role: "user",
          content: buildPromptOptimizationPrompt(data, attempt),
        },
      ],
      max_completion_tokens: 720,
      temperature: 0.3,
      top_p: 0.9,
      response_format: {
        type: "json_object",
      },
    });
    const outputText = response.choices[0]?.message?.content;

    if (!outputText) {
      return actionFailure(NO_USEFUL_PROMPT_UPDATE_ERROR);
    }

    const result = parsePromptOptimizationOutput(outputText);

    if (!result || !isMeaningfulPromptOptimization(data.content ?? "", result.optimizedPrompt)) {
      return actionFailure(NO_USEFUL_PROMPT_UPDATE_ERROR);
    }

    return actionSuccess(result);
  } catch (error) {
    console.error("AI prompt optimization failed.", error);

    return actionFailure("We couldn't optimize this prompt right now.");
  }
}

function buildPromptOptimizationPrompt(
  data: z.infer<typeof promptOptimizationSchema>,
  attempt = 1,
) {
  const content = data.content ? data.content.slice(0, PROMPT_OPTIMIZATION_CONTENT_LIMIT) : "";
  const retryInstructions =
    attempt > 1
      ? [
          "The previous rewrite was still too similar to the original.",
          "Rewrite it again with noticeably different wording, structure, and phrasing.",
          "Use markdown sections and bullets so the result is visibly more useful than a paraphrase.",
          "Keep the same intent and constraints, but make the result feel like a fresh, stronger prompt.",
        ]
      : [];

  return [
    "Rewrite this prompt into a stronger, cleaner markdown prompt.",
    "Preserve the intent, audience, and constraints.",
    "Make the result meaningfully different from the input, not a paraphrase.",
    "Do not copy the original wording or sentence structure unless it is necessary.",
    "Improve the prompt structurally by adding useful sections such as role, task, context/input, requirements, output format, and quality checks when relevant.",
    "For short one-paragraph prompts, expand them into a clearer markdown prompt with headings and bullets rather than only changing verbs or word order.",
    "Tighten the language, remove redundancy, and improve organization.",
    "If the prompt is already clear, still return a sharper and better-structured markdown version.",
    ...retryInstructions,
    "Return JSON only, using {\"optimizedPrompt\":\"...\",\"changes\":[\"...\"]}.",
    "Do not invent missing project facts or add unrelated detail.",
    `Title: ${data.title || "(none)"}`,
    `Current description: ${data.description || "(none)"}`,
    `Prompt:\n${content}`,
  ].join("\n");
}

function parseAutoTagOutput(outputText: string) {
  const parsed = JSON.parse(outputText) as unknown;
  const rawTags = Array.isArray(parsed)
    ? parsed
    : isTagObject(parsed)
      ? parsed.tags
      : [];

  return [...new Set(rawTags.map(normalizeSuggestedTag).filter(Boolean))].slice(0, MAX_AUTO_TAGS);
}

function parseItemDescriptionOutput(outputText: string) {
  const parsed = JSON.parse(outputText) as unknown;
  const description = isDescriptionObject(parsed) ? parsed.description : "";

  return normalizeGeneratedDescription(description);
}

function parseCodeExplanationOutput(outputText: string) {
  const parsed = JSON.parse(outputText) as unknown;
  const explanation = isExplanationObject(parsed) ? parsed.explanation : "";

  return normalizeGeneratedExplanation(explanation);
}

function parsePromptOptimizationOutput(outputText: string) {
  const parsed = JSON.parse(outputText) as unknown;

  if (!isPromptOptimizationObject(parsed)) {
    return null;
  }

  const optimizedPrompt = normalizeGeneratedPrompt(parsed.optimizedPrompt);
  const changes = parsed.changes
    .filter((change): change is string => typeof change === "string")
    .map((change) => change.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!optimizedPrompt) {
    return null;
  }

  return {
    optimizedPrompt,
    changes,
  };
}

function isTagObject(value: unknown): value is { tags: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "tags" in value &&
    Array.isArray((value as { tags: unknown }).tags)
  );
}

function isDescriptionObject(value: unknown): value is { description: unknown } {
  return typeof value === "object" && value !== null && "description" in value;
}

function isExplanationObject(value: unknown): value is { explanation: unknown } {
  return typeof value === "object" && value !== null && "explanation" in value;
}

function isPromptOptimizationObject(
  value: unknown,
): value is { optimizedPrompt: unknown; changes: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "optimizedPrompt" in value &&
    "changes" in value &&
    Array.isArray((value as { changes: unknown }).changes)
  );
}

function normalizeSuggestedTag(tag: unknown) {
  if (typeof tag !== "string") {
    return "";
  }

  return tag
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ");
}

function normalizeGeneratedDescription(description: unknown) {
  if (typeof description !== "string") {
    return "";
  }

  return description
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, GENERATED_DESCRIPTION_LIMIT)
    .trim();
}

function normalizeGeneratedExplanation(explanation: unknown) {
  if (typeof explanation !== "string") {
    return "";
  }

  return explanation
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, GENERATED_CODE_EXPLANATION_LIMIT)
    .trim();
}

function normalizeGeneratedPrompt(prompt: unknown) {
  if (typeof prompt !== "string") {
    return "";
  }

  return prompt.trim().replace(/\n{3,}/g, "\n\n").slice(0, GENERATED_PROMPT_LIMIT).trim();
}

function isMeaningfulPromptOptimization(original: string, optimized: string) {
  if (!hasMarkdownStructure(optimized)) {
    return false;
  }

  return !isPromptTooSimilar(original, optimized);
}

function hasMarkdownStructure(prompt: string) {
  return /(^|\n)\s{0,3}#{1,3}\s+\S/.test(prompt) || /(^|\n)\s*[-*]\s+\S/.test(prompt);
}

function isPromptTooSimilar(original: string, optimized: string) {
  const normalizedOriginal = normalizeGeneratedPrompt(original).toLowerCase();
  const normalizedOptimized = normalizeGeneratedPrompt(optimized).toLowerCase();

  if (normalizedOriginal === normalizedOptimized) {
    return true;
  }

  const originalTokens = getComparablePromptTokens(normalizedOriginal);
  const optimizedTokens = getComparablePromptTokens(normalizedOptimized);

  if (!originalTokens.length || !optimizedTokens.length) {
    return false;
  }

  const optimizedTokenSet = new Set(optimizedTokens);
  const sharedTokenCount = originalTokens.filter((token) => optimizedTokenSet.has(token)).length;
  const overlapRatio = sharedTokenCount / originalTokens.length;
  const lengthRatio = normalizedOptimized.length / Math.max(normalizedOriginal.length, 1);

  return overlapRatio >= 0.82 && lengthRatio >= 0.75 && lengthRatio <= 1.35;
}

function getComparablePromptTokens(prompt: string) {
  return prompt
    .replace(/[`*_#>-]/g, " ")
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}
