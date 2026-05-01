import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type AuthRateLimitScope =
  | "forgotPassword"
  | "login"
  | "register"
  | "resendVerification"
  | "resetPassword";

type AiRateLimitScope = "autoTag";

type AuthRateLimitKeyStrategy = "ip" | "ip-email";

type AuthRateLimitConfig = {
  keyStrategy: AuthRateLimitKeyStrategy;
  limit: number;
  window: Duration;
};

export type RateLimitCheckResult = {
  remaining: number;
  reset: number;
  success: boolean;
};

const RATE_LIMIT_CONFIG: Record<AuthRateLimitScope, AuthRateLimitConfig> = {
  forgotPassword: {
    keyStrategy: "ip",
    limit: 3,
    window: "1 h",
  },
  login: {
    keyStrategy: "ip-email",
    limit: 5,
    window: "15 m",
  },
  register: {
    keyStrategy: "ip",
    limit: 3,
    window: "1 h",
  },
  resendVerification: {
    keyStrategy: "ip-email",
    limit: 3,
    window: "15 m",
  },
  resetPassword: {
    keyStrategy: "ip",
    limit: 5,
    window: "15 m",
  },
};

const AI_RATE_LIMIT_CONFIG: Record<AiRateLimitScope, { limit: number; window: Duration }> = {
  autoTag: {
    limit: 20,
    window: "1 h",
  },
};

const RATE_LIMIT_TIMEOUT_MS = 1_000;
const RATE_LIMIT_PREFIX = "devstash:auth-rate-limit";
const AI_RATE_LIMIT_PREFIX = "devstash:ai-rate-limit";

let cachedRedis: Redis | null | undefined;
let cachedRatelimiters:
  | Record<AuthRateLimitScope, Ratelimit>
  | null
  | undefined;
let cachedAiRatelimiters:
  | Record<AiRateLimitScope, Ratelimit>
  | null
  | undefined;
let hasWarnedAboutMissingRedis = false;

function createAllowedResult(): RateLimitCheckResult {
  return {
    remaining: 1,
    reset: Date.now(),
    success: true,
  };
}

function getRedisClient() {
  if (cachedRedis !== undefined) {
    return cachedRedis;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production" && !hasWarnedAboutMissingRedis) {
      hasWarnedAboutMissingRedis = true;
      console.warn("Auth rate limiting is disabled because Upstash Redis env vars are missing.");
    }

    cachedRedis = null;
    return cachedRedis;
  }

  cachedRedis = Redis.fromEnv();
  return cachedRedis;
}

function getRatelimiters() {
  if (cachedRatelimiters !== undefined) {
    return cachedRatelimiters;
  }

  const redis = getRedisClient();

  if (!redis) {
    cachedRatelimiters = null;
    return cachedRatelimiters;
  }

  cachedRatelimiters = {
    forgotPassword: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.forgotPassword.limit,
        RATE_LIMIT_CONFIG.forgotPassword.window,
      ),
      prefix: `${RATE_LIMIT_PREFIX}:forgot-password`,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    login: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.login.limit,
        RATE_LIMIT_CONFIG.login.window,
      ),
      prefix: `${RATE_LIMIT_PREFIX}:login`,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    register: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.register.limit,
        RATE_LIMIT_CONFIG.register.window,
      ),
      prefix: `${RATE_LIMIT_PREFIX}:register`,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    resendVerification: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.resendVerification.limit,
        RATE_LIMIT_CONFIG.resendVerification.window,
      ),
      prefix: `${RATE_LIMIT_PREFIX}:resend-verification`,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    resetPassword: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.resetPassword.limit,
        RATE_LIMIT_CONFIG.resetPassword.window,
      ),
      prefix: `${RATE_LIMIT_PREFIX}:reset-password`,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
  };

  return cachedRatelimiters;
}

function getAiRatelimiters() {
  if (cachedAiRatelimiters !== undefined) {
    return cachedAiRatelimiters;
  }

  const redis = getRedisClient();

  if (!redis) {
    cachedAiRatelimiters = null;
    return cachedAiRatelimiters;
  }

  cachedAiRatelimiters = {
    autoTag: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        AI_RATE_LIMIT_CONFIG.autoTag.limit,
        AI_RATE_LIMIT_CONFIG.autoTag.window,
      ),
      prefix: `${AI_RATE_LIMIT_PREFIX}:auto-tag`,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
  };

  return cachedAiRatelimiters;
}

function normalizeEmail(email?: string | null) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getHeaders(input: Headers | Request) {
  return input instanceof Request ? input.headers : input;
}

export function getClientIp(input: Headers | Request) {
  const headers = getHeaders(input);
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    const forwardedIp = forwardedFor.split(",")[0]?.trim();

    if (forwardedIp) {
      return forwardedIp;
    }
  }

  const directIp =
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for");

  return directIp?.trim() || null;
}

function buildIdentifier(scope: AuthRateLimitScope, ip: string | null, email?: string | null) {
  if (RATE_LIMIT_CONFIG[scope].keyStrategy === "ip") {
    return ip;
  }

  const normalizedEmail = normalizeEmail(email);

  if (ip && normalizedEmail) {
    return `${ip}:${normalizedEmail}`;
  }

  if (ip) {
    return `${ip}:unknown`;
  }

  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  return null;
}

export async function checkAuthRateLimit(
  scope: AuthRateLimitScope,
  options: {
    email?: string | null;
    request: Headers | Request;
  },
): Promise<RateLimitCheckResult> {
  const ratelimiters = getRatelimiters();

  if (!ratelimiters) {
    // Local development can run without Redis; production should configure Upstash.
    return createAllowedResult();
  }

  const ip = getClientIp(options.request);
  const identifier = buildIdentifier(scope, ip, options.email);

  if (!identifier) {
    return createAllowedResult();
  }

  try {
    const result = await ratelimiters[scope].limit(identifier, ip ? { ip } : undefined);

    void result.pending.catch(() => undefined);

    return {
      remaining: result.remaining,
      reset: result.reset,
      success: result.success,
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${scope}. Allowing request.`, error);

    return createAllowedResult();
  }
}

export async function checkAiRateLimit(
  scope: AiRateLimitScope,
  userId: string,
): Promise<RateLimitCheckResult> {
  const ratelimiters = getAiRatelimiters();

  if (!ratelimiters) {
    // Local development can run without Redis; production should configure Upstash.
    return createAllowedResult();
  }

  try {
    const result = await ratelimiters[scope].limit(userId);

    void result.pending.catch(() => undefined);

    return {
      remaining: result.remaining,
      reset: result.reset,
      success: result.success,
    };
  } catch (error) {
    console.error(`AI rate limit check failed for ${scope}. Allowing request.`, error);

    return createAllowedResult();
  }
}

export function getRetryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

function formatRetryDelay(reset: number) {
  const retryAfterSeconds = getRetryAfterSeconds(reset);
  const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

  return retryAfterMinutes === 1 ? "1 minute" : `${retryAfterMinutes} minutes`;
}

export function getRateLimitErrorMessage(reset: number) {
  return `Too many attempts. Please try again in ${formatRetryDelay(reset)}.`;
}

export function createRateLimitResponse(result: RateLimitCheckResult) {
  return NextResponse.json(
    {
      success: false,
      error: getRateLimitErrorMessage(result.reset),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(getRetryAfterSeconds(result.reset)),
      },
    },
  );
}
