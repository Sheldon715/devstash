import { createHash, randomBytes } from "crypto";

import { hash } from "bcryptjs";

import {
  isValidPasswordResetPassword,
} from "@/lib/password-rules";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;
const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_FROM_EMAIL = "onboarding@resend.dev";

export type PasswordResetTokenStatus = "expired" | "invalid" | "valid";
export type ResetPasswordResult = "expired" | "invalid" | "success";

function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPasswordResetIdentifier(email: string) {
  return `password-reset:${normalizeEmail(email)}`;
}

export function buildPasswordResetUrl(email: string, token: string, origin: string) {
  const resetUrl = new URL("/reset-password", origin);

  resetUrl.searchParams.set("email", normalizeEmail(email));
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function createPasswordResetToken(email: string) {
  const identifier = getPasswordResetIdentifier(email);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashPasswordResetToken(token),
      expires,
    },
  });

  return {
    expires,
    token,
  };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required to send password reset emails.");
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
      subject: "Reset your DevStash password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Reset your password</h1>
          <p style="margin-bottom: 16px;">
            We received a request to reset the password for your DevStash account.
          </p>
          <p style="margin-bottom: 16px;">
            This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.
          </p>
          <p style="margin-bottom: 24px;">
            <a
              href="${resetUrl}"
              style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #111827; color: #ffffff; text-decoration: none; font-weight: 600;"
            >
              Reset password
            </a>
          </p>
          <p style="margin-bottom: 0;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; margin-top: 8px;">${resetUrl}</p>
        </div>
      `,
      text: [
        "Reset your DevStash password",
        "",
        "We received a request to reset the password for your DevStash account.",
        "This link expires in 1 hour.",
        "Open this link to choose a new password:",
        resetUrl,
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

  throw new Error(`Unable to send password reset email: ${resendError}`);
}

export async function requestPasswordReset(email: string, origin: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      email: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return;
  }

  const { token } = await createPasswordResetToken(normalizedEmail);
  const resetUrl = buildPasswordResetUrl(normalizedEmail, token, origin);

  await sendPasswordResetEmail(normalizedEmail, resetUrl);
}

export async function getPasswordResetTokenStatus(
  email: string,
  token: string,
): Promise<PasswordResetTokenStatus> {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return "invalid";
  }

  const identifier = getPasswordResetIdentifier(normalizedEmail);
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: hashPasswordResetToken(token),
    },
    select: {
      expires: true,
    },
  });

  if (!verificationToken) {
    return "invalid";
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    });

    return "expired";
  }

  return "valid";
}

export async function resetPassword(email: string, token: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidPasswordResetPassword(password)) {
    return "invalid" satisfies ResetPasswordResult;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return "invalid" satisfies ResetPasswordResult;
  }

  const identifier = getPasswordResetIdentifier(normalizedEmail);
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: hashPasswordResetToken(token),
    },
    select: {
      expires: true,
    },
  });

  if (!verificationToken) {
    return "invalid" satisfies ResetPasswordResult;
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    });

    return "expired" satisfies ResetPasswordResult;
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    }),
    prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    }),
  ]);

  return "success" satisfies ResetPasswordResult;
}
