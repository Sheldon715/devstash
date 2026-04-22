import { NextResponse } from "next/server";

import { resetPassword } from "@/lib/password-reset";
import {
  isValidPasswordResetPassword,
  PASSWORD_RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";
import { checkAuthRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

type ResetPasswordRequestBody = {
  confirmPassword?: unknown;
  email?: unknown;
  password?: unknown;
  token?: unknown;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseResetPasswordRequestBody(body: ResetPasswordRequestBody) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!email || !password || !confirmPassword || !token) {
    return {
      error: "Email, token, password, and confirmPassword are required.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      error: "Enter a valid email address.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
    };
  }

  if (!isValidPasswordResetPassword(password)) {
    return {
      error: `Use at least ${PASSWORD_RESET_MIN_PASSWORD_LENGTH} characters for your password.`,
    };
  }

  return {
    data: {
      email,
      password,
      token,
    },
  };
}

export async function POST(request: Request) {
  let body: ResetPasswordRequestBody;

  try {
    body = (await request.json()) as ResetPasswordRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedBody = parseResetPasswordRequestBody(body);

  if ("error" in parsedBody) {
    return NextResponse.json(
      {
        success: false,
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  const rateLimitResult = await checkAuthRateLimit("resetPassword", {
    request,
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const result = await resetPassword(
    parsedBody.data.email,
    parsedBody.data.token,
    parsedBody.data.password,
  );

  if (result === "invalid") {
    return NextResponse.json(
      {
        success: false,
        error: "That password reset link is invalid or has already been used.",
      },
      { status: 400 },
    );
  }

  if (result === "expired") {
    return NextResponse.json(
      {
        success: false,
        error: "That password reset link has expired. Request a new one.",
      },
      { status: 400 },
    );
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
