import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_FROM_EMAIL = "onboarding@resend.dev";

export type VerifyEmailAddressResult =
  | { status: "already_verified" | "invalid" | "expired" }
  | { status: "success" };

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function buildEmailVerificationUrl(email: string, token: string, origin: string) {
  const verificationUrl = new URL("/api/auth/verify-email", origin);

  verificationUrl.searchParams.set("email", normalizeEmail(email));
  verificationUrl.searchParams.set("token", token);

  return verificationUrl.toString();
}

export async function sendVerificationEmailForAddress(email: string, origin: string) {
  const normalizedEmail = normalizeEmail(email);
  const { token } = await createEmailVerificationToken(normalizedEmail);
  const verificationUrl = buildEmailVerificationUrl(normalizedEmail, token, origin);

  await sendEmailVerificationEmail(normalizedEmail, verificationUrl);
}

export async function createEmailVerificationToken(email: string) {
  const identifier = normalizeEmail(email);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashVerificationToken(token),
      expires,
    },
  });

  return {
    expires,
    token,
  };
}

export async function sendEmailVerificationEmail(email: string, verificationUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required to send verification emails.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [normalizeEmail(email)],
      subject: "Verify your DevStash email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Verify your email</h1>
          <p style="margin-bottom: 16px;">
            Thanks for creating your DevStash account. Click the button below to verify your email address.
          </p>
          <p style="margin-bottom: 24px;">
            <a
              href="${verificationUrl}"
              style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #111827; color: #ffffff; text-decoration: none; font-weight: 600;"
            >
              Verify email
            </a>
          </p>
          <p style="margin-bottom: 0;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; margin-top: 8px;">${verificationUrl}</p>
        </div>
      `,
      text: [
        "Verify your DevStash email",
        "",
        "Thanks for creating your DevStash account.",
        "Open this link to verify your email address:",
        verificationUrl,
      ].join("\n"),
    }),
  });

  if (response.ok) {
    return;
  }

  let resendError = "Resend email request failed.";

  try {
    const responseBody = (await response.json()) as { message?: unknown; name?: unknown };

    if (typeof responseBody.message === "string" && responseBody.message.trim()) {
      resendError = responseBody.message;
    } else if (typeof responseBody.name === "string" && responseBody.name.trim()) {
      resendError = responseBody.name;
    }
  } catch {
    // Ignore JSON parsing issues and fall back to the default message.
  }

  throw new Error(`Unable to send verification email: ${resendError}`);
}

export async function verifyEmailAddress(
  email: string,
  token: string,
): Promise<VerifyEmailAddressResult> {
  const normalizedEmail = normalizeEmail(email);
  const hashedToken = hashVerificationToken(token);
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      emailVerified: true,
      id: true,
    },
  });

  if (!user) {
    return {
      status: "invalid",
    };
  }

  if (user.emailVerified) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
      },
    });

    return {
      status: "already_verified",
    };
  }

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      token: hashedToken,
    },
    select: {
      expires: true,
      identifier: true,
    },
  });

  if (!verificationToken) {
    return {
      status: "invalid",
    };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
      },
    });

    return {
      status: "expired",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        email: normalizedEmail,
      },
      data: {
        emailVerified: new Date(),
      },
    }),
    prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
      },
    }),
  ]);

  return {
    status: "success",
  };
}
