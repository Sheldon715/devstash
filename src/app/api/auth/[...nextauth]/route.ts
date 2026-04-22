import type { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { checkAuthRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname.endsWith("/callback/credentials")) {
    let email = "";

    try {
      const formData = await request.clone().formData();
      const emailValue = formData.get("email");

      email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
    } catch {
      email = "";
    }

    const rateLimitResult = await checkAuthRateLimit("login", {
      email,
      request,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }
  }

  return handlers.POST(request);
}
