import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/lib/password-reset";
import { checkAuthRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

type ForgotPasswordRequestBody = {
  email?: unknown;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseForgotPasswordRequestBody(body: ForgotPasswordRequestBody) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return {
      error: "Email is required.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      error: "Enter a valid email address.",
    };
  }

  return {
    data: {
      email,
    },
  };
}

export async function POST(request: Request) {
  let body: ForgotPasswordRequestBody;

  try {
    body = (await request.json()) as ForgotPasswordRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedBody = parseForgotPasswordRequestBody(body);

  if ("error" in parsedBody) {
    return NextResponse.json(
      {
        success: false,
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  const rateLimitResult = await checkAuthRateLimit("forgotPassword", {
    request,
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    await requestPasswordReset(parsedBody.data.email, new URL(request.url).origin);
  } catch (error) {
    // Keep the response generic so this endpoint does not reveal whether an account exists.
    console.error("Password reset request failed.", error);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        email: parsedBody.data.email,
      },
    },
    { status: 200 },
  );
}
