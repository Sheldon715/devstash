import type { DefaultSession } from "next-auth";
import type { Plan } from "../../generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isPro: boolean;
      plan: Plan;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: Plan;
  }
}
