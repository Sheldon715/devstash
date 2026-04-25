import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import {
  sendVerificationEmailForAddress,
} from "@/lib/email-verification";
import { isEmailVerificationRequired } from "@/lib/email-verification-settings";
import { getPublicAppOrigin } from "@/lib/app-url";
import { isValidEmail, normalizeEmailAddress } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

type RegisterRequestBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

function parseRegisterRequestBody(body: RegisterRequestBody) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmailAddress(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!email || !password || !confirmPassword) {
    return {
      error: "Email, password, and confirmPassword are required.",
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

  return {
    data: {
      name: name || null,
      email,
      password,
    },
  };
}

export async function POST(request: Request) {
  let body: RegisterRequestBody;

  try {
    body = (await request.json()) as RegisterRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedBody = parseRegisterRequestBody(body);
  const origin = getPublicAppOrigin(request.url);
  const emailVerificationRequired = isEmailVerificationRequired();

  if ("error" in parsedBody) {
    return NextResponse.json(
      {
        success: false,
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  const rateLimitResult = await checkAuthRateLimit("register", {
    request,
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsedBody.data.email,
    },
    select: {
      email: true,
      emailVerified: true,
      id: true,
    },
  });

  if (existingUser) {
    if (existingUser.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    if (emailVerificationRequired) {
      await sendVerificationEmailForAddress(existingUser.email, origin);
    } else {
      await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          emailVerified: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          email: existingUser.email,
          requiresEmailVerification: emailVerificationRequired,
        },
      },
      { status: 200 },
    );
  }

  const passwordHash = await hash(parsedBody.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      emailVerified: emailVerificationRequired ? null : new Date(),
      passwordHash,
    },
    select: {
      email: true,
    },
  });

  if (emailVerificationRequired) {
    await sendVerificationEmailForAddress(user.email, origin);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        ...user,
        requiresEmailVerification: emailVerificationRequired,
      },
    },
    { status: 201 },
  );
}
