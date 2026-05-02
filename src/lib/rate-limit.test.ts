import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const createdRatelimitConfigs: unknown[] = [];
  const limitMock = vi.fn();
  const fromEnvMock = vi.fn(() => ({}));
  const slidingWindowMock = vi.fn((limit: number, window: string) => ({
    limit,
    window,
  }));
  const ratelimitConstructorMock = vi.fn(function RatelimitMock(config: unknown) {
    createdRatelimitConfigs.push(config);

    return {
      limit: limitMock,
    };
  });

  return {
    createdRatelimitConfigs,
    fromEnvMock,
    limitMock,
    ratelimitConstructorMock,
    slidingWindowMock,
  };
});

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: mocks.fromEnvMock,
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(mocks.ratelimitConstructorMock, {
    slidingWindow: mocks.slidingWindowMock,
  }),
}));

const ORIGINAL_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
};

describe("rate-limit utilities", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createdRatelimitConfigs.length = 0;
    mocks.fromEnvMock.mockClear();
    mocks.limitMock.mockReset();
    mocks.ratelimitConstructorMock.mockClear();
    mocks.slidingWindowMock.mockClear();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
    process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_ENV.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_ENV.UPSTASH_REDIS_REST_URL;
  });

  it("allows AI rate limit checks when Redis is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;

    const { checkAiRateLimit } = await import("./rate-limit");

    await expect(checkAiRateLimit("promptOptimize", "user-1")).resolves.toEqual({
      remaining: 1,
      reset: expect.any(Number),
      success: true,
    });
    expect(mocks.fromEnvMock).not.toHaveBeenCalled();
    expect(mocks.limitMock).not.toHaveBeenCalled();
  });

  it("uses the prompt optimization AI rate-limit scope", async () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.test";
    mocks.limitMock.mockResolvedValue({
      pending: Promise.resolve(),
      remaining: 9,
      reset: 1_800_000,
      success: true,
    });

    const { checkAiRateLimit } = await import("./rate-limit");

    const result = await checkAiRateLimit("promptOptimize", "user-1");
    const promptOptimizeConfig = mocks.createdRatelimitConfigs.find(
      (config): config is { limiter: unknown; prefix: string; timeout: number } =>
        typeof config === "object" &&
        config !== null &&
        "prefix" in config &&
        (config as { prefix: unknown }).prefix === "devstash:ai-rate-limit:prompt-optimize",
    );

    expect(result).toEqual({
      remaining: 9,
      reset: 1_800_000,
      success: true,
    });
    expect(mocks.slidingWindowMock).toHaveBeenCalledWith(10, "1 h");
    expect(promptOptimizeConfig).toEqual({
      limiter: { limit: 10, window: "1 h" },
      prefix: "devstash:ai-rate-limit:prompt-optimize",
      redis: {},
      timeout: 1_000,
    });
    expect(mocks.limitMock).toHaveBeenCalledWith("user-1");
  });
});
