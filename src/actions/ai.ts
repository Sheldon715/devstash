"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getOpenAIClient, AI_MODEL } from "@/lib/ai/openai";
import { getUserBillingUsage } from "@/lib/billing/usage";
import { checkAiRateLimit, getRateLimitErrorMessage } from "@/lib/rate-limit";

const AUTO_TAG_CONTENT_LIMIT = 2_000;
const CODE_EXPLANATION_CONTENT_LIMIT = 6_000;
const DESCRIPTION_CONTENT_LIMIT = 2_000;
const GENERATED_CODE_EXPLANATION_LIMIT = 2_400;
const GENERATED_DESCRIPTION_LIMIT = 500;
const MAX_AUTO_TAGS = 5;

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

interface GenerateAutoTagsSuccess {
  success: true;
  data: {
    tags: string[];
  };
  error: null;
}

interface GenerateAutoTagsFailure {
  success: false;
  data: null;
  error: string;
}

export type GenerateAutoTagsResult = GenerateAutoTagsSuccess | GenerateAutoTagsFailure;

interface GenerateItemDescriptionSuccess {
  success: true;
  data: {
    description: string;
  };
  error: null;
}

interface GenerateItemDescriptionFailure {
  success: false;
  data: null;
  error: string;
}

export type GenerateItemDescriptionResult =
  | GenerateItemDescriptionSuccess
  | GenerateItemDescriptionFailure;

interface ExplainCodeSuccess {
  success: true;
  data: {
    explanation: string;
  };
  error: null;
}

interface ExplainCodeFailure {
  success: false;
  data: null;
  error: string;
}

export type ExplainCodeResult = ExplainCodeSuccess | ExplainCodeFailure;

export async function generateAutoTags(data: unknown): Promise<GenerateAutoTagsResult> {
  const parsedData = autoTagSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      data: null,
      error: parsedData.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to suggest tags.",
    };
  }

  const usage = await getUserBillingUsage(session.user.id);

  if (!usage.isPro) {
    return {
      success: false,
      data: null,
      error: "AI tag suggestions require DevStash Pro.",
    };
  }

  const rateLimitResult = await checkAiRateLimit("autoTag", session.user.id);

  if (!rateLimitResult.success) {
    return {
      success: false,
      data: null,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
    };
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
      return {
        success: false,
        data: null,
        error: "No useful tag suggestions were generated.",
      };
    }

    const tags = parseAutoTagOutput(outputText);

    if (!tags.length) {
      return {
        success: false,
        data: null,
        error: "No useful tag suggestions were generated.",
      };
    }

    return {
      success: true,
      data: {
        tags,
      },
      error: null,
    };
  } catch (error) {
    console.error("AI auto-tag generation failed.", error);

    return {
      success: false,
      data: null,
      error: "We couldn't suggest tags right now.",
    };
  }
}

export async function generateItemDescription(
  data: unknown,
): Promise<GenerateItemDescriptionResult> {
  const parsedData = itemDescriptionSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      data: null,
      error: parsedData.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to generate descriptions.",
    };
  }

  const usage = await getUserBillingUsage(session.user.id);

  if (!usage.isPro) {
    return {
      success: false,
      data: null,
      error: "AI descriptions require DevStash Pro.",
    };
  }

  const rateLimitResult = await checkAiRateLimit("descriptionSummary", session.user.id);

  if (!rateLimitResult.success) {
    return {
      success: false,
      data: null,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
    };
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
      return {
        success: false,
        data: null,
        error: "No useful description was generated.",
      };
    }

    const description = parseItemDescriptionOutput(outputText);

    if (!description) {
      return {
        success: false,
        data: null,
        error: "No useful description was generated.",
      };
    }

    return {
      success: true,
      data: {
        description,
      },
      error: null,
    };
  } catch (error) {
    console.error("AI description generation failed.", error);

    return {
      success: false,
      data: null,
      error: "We couldn't generate a description right now.",
    };
  }
}

export async function explainCode(data: unknown): Promise<ExplainCodeResult> {
  const parsedData = codeExplanationSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      data: null,
      error: parsedData.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to explain code.",
    };
  }

  const usage = await getUserBillingUsage(session.user.id);

  if (!usage.isPro) {
    return {
      success: false,
      data: null,
      error: "AI code explanations require DevStash Pro.",
    };
  }

  const rateLimitResult = await checkAiRateLimit("codeExplain", session.user.id);

  if (!rateLimitResult.success) {
    return {
      success: false,
      data: null,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
    };
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
      return {
        success: false,
        data: null,
        error: "No useful explanation was generated.",
      };
    }

    const explanation = parseCodeExplanationOutput(outputText);

    if (!explanation) {
      return {
        success: false,
        data: null,
        error: "No useful explanation was generated.",
      };
    }

    return {
      success: true,
      data: {
        explanation,
      },
      error: null,
    };
  } catch (error) {
    console.error("AI code explanation failed.", error);

    return {
      success: false,
      data: null,
      error: "We couldn't explain this code right now.",
    };
  }
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
