import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  checkAiRateLimitMock,
  getAiClientMock,
  getUserBillingUsageMock,
  chatCompletionsCreateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  checkAiRateLimitMock: vi.fn(),
  getAiClientMock: vi.fn(),
  getUserBillingUsageMock: vi.fn(),
  chatCompletionsCreateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/ai/openai", () => ({
  AI_MODEL: "mimo-v2-flash",
  getOpenAIClient: getAiClientMock,
}));

vi.mock("@/lib/billing/usage", () => ({
  getUserBillingUsage: getUserBillingUsageMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAiRateLimit: checkAiRateLimitMock,
  getRateLimitErrorMessage: (reset: number) => `Too many attempts. Reset at ${reset}.`,
}));

import { explainCode, generateAutoTags, generateItemDescription } from "@/actions/ai";

describe("AI actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    checkAiRateLimitMock.mockReset();
    getAiClientMock.mockReset();
    getUserBillingUsageMock.mockReset();
    chatCompletionsCreateMock.mockReset();

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getUserBillingUsageMock.mockResolvedValue({
      plan: "PRO",
      isPro: true,
      totalItems: 0,
      totalCollections: 0,
    });
    checkAiRateLimitMock.mockResolvedValue({
      remaining: 19,
      reset: Date.now() + 60_000,
      success: true,
    });
    getAiClientMock.mockReturnValue({
      chat: {
        completions: {
          create: chatCompletionsCreateMock,
        },
      },
    });
    chatCompletionsCreateMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ["React", " Hooks ", "#React", "state management"],
            }),
          },
        },
      ],
    });
  });

  it("returns validation errors before checking auth", async () => {
    const result = await generateAutoTags({
      title: "   ",
      description: "",
      content: "",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Add a title or content before suggesting tags.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateAutoTags({
      title: "Useful snippet",
      content: "useEffect(() => {}, [])",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "You need to be signed in to suggest tags.",
    });
    expect(getUserBillingUsageMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("blocks Free users before rate limiting or calling OpenAI", async () => {
    getUserBillingUsageMock.mockResolvedValue({
      plan: "FREE",
      isPro: false,
      totalItems: 0,
      totalCollections: 0,
    });

    const result = await generateAutoTags({
      title: "Useful snippet",
      content: "useEffect(() => {}, [])",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "AI tag suggestions require DevStash Pro.",
    });
    expect(checkAiRateLimitMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("returns a rate limit error before calling OpenAI", async () => {
    checkAiRateLimitMock.mockResolvedValue({
      remaining: 0,
      reset: 12345,
      success: false,
    });

    const result = await generateAutoTags({
      title: "Useful snippet",
      content: "useEffect(() => {}, [])",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Too many attempts. Reset at 12345.",
    });
    expect(checkAiRateLimitMock).toHaveBeenCalledWith("autoTag", "user-1");
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("uses the chat completions API and normalizes object-shaped tags", async () => {
    const result = await generateAutoTags({
      title: "React state helper",
      description: "Small hook utility",
      content: "export function useToggle() { return null; }",
    });
    const request = chatCompletionsCreateMock.mock.calls[0]?.[0] as
      | { messages?: Array<{ content?: string | Array<{ text?: string }> }> }
      | undefined;

    expect(chatCompletionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mimo-v2-flash",
        temperature: 0.3,
        top_p: 0.95,
        max_completion_tokens: 256,
        response_format: { type: "json_object" },
      }),
    );
    expect(request?.messages?.[1]?.content).toContain("Return JSON only");
    expect(result).toEqual({
      success: true,
      data: {
        tags: ["react", "hooks", "state management"],
      },
      error: null,
    });
  });

  it("handles array-shaped tag output and truncates content", async () => {
    chatCompletionsCreateMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(["Next.js", "Server Actions", "OpenAI"]),
          },
        },
      ],
    });

    const result = await generateAutoTags({
      title: "AI action",
      content: "a".repeat(2_100),
    });
    const request = chatCompletionsCreateMock.mock.calls[0]?.[0] as
      | { messages?: Array<{ content?: string | Array<{ text?: string }> }> }
      | undefined;

    expect(request?.messages?.[1]?.content).toContain("a".repeat(2_000));
    expect(request?.messages?.[1]?.content).not.toContain("a".repeat(2_001));
    expect(result).toEqual({
      success: true,
      data: {
        tags: ["next.js", "server actions", "openai"],
      },
      error: null,
    });
  });

  it("returns a generic error when OpenAI fails", async () => {
    chatCompletionsCreateMock.mockRejectedValue(new Error("service unavailable"));

    const result = await generateAutoTags({
      title: "Useful snippet",
      content: "useEffect(() => {}, [])",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "We couldn't suggest tags right now.",
    });
  });

  it("returns validation errors before generating a description", async () => {
    const result = await generateItemDescription({
      title: "   ",
      description: "",
      content: "",
      url: "",
      fileName: "",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Add a title, content, URL, or file before generating a description.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("blocks Free users before generating a description", async () => {
    getUserBillingUsageMock.mockResolvedValue({
      plan: "FREE",
      isPro: false,
      totalItems: 0,
      totalCollections: 0,
    });

    const result = await generateItemDescription({
      title: "Build command",
      content: "npm run build",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "AI descriptions require DevStash Pro.",
    });
    expect(checkAiRateLimitMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("generates concise descriptions from the available item inputs", async () => {
    chatCompletionsCreateMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              description:
                "Runs the production build and catches compile-time issues before release.",
            }),
          },
        },
      ],
    });

    const result = await generateItemDescription({
      title: "Production build",
      description: "",
      content: "npm run build",
      itemType: "command",
      url: "https://nextjs.org/docs",
      fileName: "release-notes.md",
      fileMimeType: "text/markdown",
    });
    const request = chatCompletionsCreateMock.mock.calls[0]?.[0] as
      | { messages?: Array<{ content?: string | Array<{ text?: string }> }> }
      | undefined;

    expect(checkAiRateLimitMock).toHaveBeenCalledWith("descriptionSummary", "user-1");
    expect(chatCompletionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mimo-v2-flash",
        temperature: 0.25,
        top_p: 0.9,
        max_completion_tokens: 220,
        response_format: { type: "json_object" },
      }),
    );
    expect(request?.messages?.[1]?.content).toContain("Write a good, concise 1-2 sentence");
    expect(request?.messages?.[1]?.content).toContain("Item type: command");
    expect(request?.messages?.[1]?.content).toContain("File name: release-notes.md");
    expect(result).toEqual({
      success: true,
      data: {
        description:
          "Runs the production build and catches compile-time issues before release.",
      },
      error: null,
    });
  });

  it("returns a generic error when description generation fails", async () => {
    chatCompletionsCreateMock.mockRejectedValue(new Error("service unavailable"));

    const result = await generateItemDescription({
      title: "Useful snippet",
      content: "useEffect(() => {}, [])",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "We couldn't generate a description right now.",
    });
  });

  it("validates code explanation inputs before checking auth", async () => {
    const result = await explainCode({
      title: "Empty snippet",
      content: "   ",
      itemType: "snippet",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Add code or a command before generating an explanation.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("blocks unsupported item types for code explanations", async () => {
    const result = await explainCode({
      title: "Readable note",
      content: "Some note content",
      itemType: "note",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Code explanations are available for snippets and commands only.",
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("blocks Free users before explaining code", async () => {
    getUserBillingUsageMock.mockResolvedValue({
      plan: "FREE",
      isPro: false,
      totalItems: 0,
      totalCollections: 0,
    });

    const result = await explainCode({
      title: "Build command",
      content: "npm run build",
      itemType: "command",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "AI code explanations require DevStash Pro.",
    });
    expect(checkAiRateLimitMock).not.toHaveBeenCalled();
    expect(chatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("generates markdown code explanations and truncates long content", async () => {
    chatCompletionsCreateMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              explanation:
                "## What it does\n\nRuns the production build and reports compile-time issues.",
            }),
          },
        },
      ],
    });

    const result = await explainCode({
      title: "Production build",
      content: "a".repeat(6_100),
      itemType: "command",
      language: "bash",
    });
    const request = chatCompletionsCreateMock.mock.calls[0]?.[0] as
      | { messages?: Array<{ content?: string | Array<{ text?: string }> }> }
      | undefined;

    expect(checkAiRateLimitMock).toHaveBeenCalledWith("codeExplain", "user-1");
    expect(chatCompletionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mimo-v2-flash",
        temperature: 0.2,
        top_p: 0.9,
        max_completion_tokens: 520,
        response_format: { type: "json_object" },
      }),
    );
    expect(request?.messages?.[1]?.content).toContain("roughly 200-300 words");
    expect(request?.messages?.[1]?.content).toContain("Language: bash");
    expect(request?.messages?.[1]?.content).toContain("a".repeat(6_000));
    expect(request?.messages?.[1]?.content).not.toContain("a".repeat(6_001));
    expect(result).toEqual({
      success: true,
      data: {
        explanation:
          "## What it does\n\nRuns the production build and reports compile-time issues.",
      },
      error: null,
    });
  });

  it("returns a generic error when code explanation generation fails", async () => {
    chatCompletionsCreateMock.mockRejectedValue(new Error("service unavailable"));

    const result = await explainCode({
      title: "Useful snippet",
      content: "useEffect(() => {}, [])",
      itemType: "snippet",
    });

    expect(result).toEqual({
      success: false,
      data: null,
      error: "We couldn't explain this code right now.",
    });
  });
});
