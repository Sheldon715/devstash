import { compare } from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { CredentialsSignin, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig, { credentialsInputConfig } from "@/auth.config";
import { isEmailVerificationRequired } from "@/lib/email-verification-settings";
import { prisma } from "@/lib/prisma";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

function parseCredentials(
  credentials: Partial<Record<keyof typeof credentialsInputConfig, unknown>>,
) {
  const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

async function authorizeCredentials(
  credentials: Partial<Record<keyof typeof credentialsInputConfig, unknown>>,
): Promise<User | null> {
  const parsedCredentials = parseCredentials(credentials);

  if (!parsedCredentials) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsedCredentials.email,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const passwordsMatch = await compare(parsedCredentials.password, user.passwordHash);

  if (!passwordsMatch) {
    return null;
  }

  if (isEmailVerificationRequired() && !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}

const providers =
  authConfig.providers?.map((provider) =>
    provider.id === "credentials"
      ? Credentials({
          credentials: credentialsInputConfig,
          authorize: authorizeCredentials,
        })
      : provider,
  ) ?? [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
