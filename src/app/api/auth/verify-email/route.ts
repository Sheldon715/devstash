import { NextResponse } from "next/server";

import { verifyEmailAddress } from "@/lib/email-verification";

function createSignInRedirectUrl(request: Request, email?: string) {
  const redirectUrl = new URL("/sign-in", request.url);

  if (email) {
    redirectUrl.searchParams.set("email", email);
  }

  return redirectUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const email = requestUrl.searchParams.get("email")?.trim().toLowerCase();
  const token = requestUrl.searchParams.get("token")?.trim();

  if (!email || !token) {
    const redirectUrl = createSignInRedirectUrl(request);

    redirectUrl.searchParams.set("verificationError", "invalid");

    return NextResponse.redirect(redirectUrl);
  }

  const result = await verifyEmailAddress(email, token);
  const redirectUrl = createSignInRedirectUrl(request, email);

  if (result.status === "success" || result.status === "already_verified") {
    redirectUrl.searchParams.set("verified", "1");

    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("verificationError", result.status);

  return NextResponse.redirect(redirectUrl);
}
