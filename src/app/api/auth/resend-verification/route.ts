import { NextResponse } from "next/server";

import {
  sendVerificationEmailForAddress,
} from "@/lib/email-verification";
import { isEmailVerificationRequired } from "@/lib/email-verification-settings";
import { prisma } from "@/lib/prisma";
import {
  checkAuthRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

type ResendVerificationRequestBody = {
  email?: unknown;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseResendVerificationRequestBody(body: ResendVerificationRequestBody) {
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
  let body: ResendVerificationRequestBody;

  try {
    body = (await request.json()) as ResendVerificationRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedBody = parseResendVerificationRequestBody(body);

  if ("error" in parsedBody) {
    return NextResponse.json(
      {
        success: false,
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  if (!isEmailVerificationRequired()) {
    return NextResponse.json(
      {
        success: false,
        error: "Email verification is currently disabled.",
      },
      { status: 400 },
    );
  }

  const rateLimitResult = await checkAuthRateLimit("resendVerification", {
    email: parsedBody.data.email,
    request,
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsedBody.data.email,
    },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (user && !user.emailVerified) {
    await sendVerificationEmailForAddress(user.email, new URL(request.url).origin);
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
