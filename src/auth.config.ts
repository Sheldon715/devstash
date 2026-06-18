import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

export const credentialsInputConfig = {
  email: {
    label: "Email",
    type: "email",
    placeholder: "name@example.com",
  },
  password: {
    label: "Password",
    type: "password",
  },
} as const;

const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub({}),
    Credentials({
      credentials: credentialsInputConfig,
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
