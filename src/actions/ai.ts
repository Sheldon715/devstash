"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getOpenAIClient, AI_MODEL } from "@/lib/ai/openai";
import { getUserBillingUsage } from "@/lib/billing/usage";
import { checkAiRateLimit, getRateLimitErrorMessage } from "@/lib/rate-limit";

const AUTO_TAG_CONTENT_LIMIT = 2_000;
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

function parseAutoTagOutput(outputText: string) {
  const parsed = JSON.parse(outputText) as unknown;
  const rawTags = Array.isArray(parsed)
    ? parsed
    : isTagObject(parsed)
      ? parsed.tags
      : [];

  return [...new Set(rawTags.map(normalizeSuggestedTag).filter(Boolean))].slice(0, MAX_AUTO_TAGS);
}

function isTagObject(value: unknown): value is { tags: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "tags" in value &&
    Array.isArray((value as { tags: unknown }).tags)
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
