"use server";

import { headers } from "next/headers";
import { AuthError, CredentialsSignin } from "next-auth";

import { signIn, signOut } from "@/auth";
import type { SignInActionState } from "@/actions/auth-state";
import { checkAuthRateLimit, getRateLimitErrorMessage } from "@/lib/rate-limit";

function getRedirectTarget(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return "/dashboard";
  }

  return value;
}

export async function signInWithCredentialsAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const redirectTo = getRedirectTarget(formData.get("callbackUrl"));

  if (!email || !password) {
    return {
      email,
      error: "Enter both your email and password.",
      resendVerificationEmail: null,
    };
  }

  const rateLimitResult = await checkAuthRateLimit("login", {
    email,
    request: new Headers(await headers()),
  });

  if (!rateLimitResult.success) {
    return {
      email,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
      resendVerificationEmail: null,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "email_not_verified") {
      return {
        email,
        error: "Verify your email before signing in. Check your inbox for the verification link.",
        resendVerificationEmail: email,
      };
    }

    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          email,
          error: "Invalid email or password.",
          resendVerificationEmail: null,
        };
      }

      return {
        email,
        error: "We couldn't sign you in right now. Please try again.",
        resendVerificationEmail: null,
      };
    }

    throw error;
  }

  return {
    email,
    error: null,
    resendVerificationEmail: null,
  };
}

export async function signInWithGitHubAction(formData: FormData) {
  await signIn("github", {
    redirectTo: getRedirectTarget(formData.get("callbackUrl")),
  });
}

export async function signOutAction() {
  await signOut({
    redirectTo: "/sign-in",
  });
}
