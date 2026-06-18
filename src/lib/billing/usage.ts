import { prisma } from "@/lib/prisma";
import { isProPlan } from "@/lib/billing/usage-limits";

export async function getUserBillingUsage(userId: string) {
  const [user, totalItems, totalCollections] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        plan: true,
      },
    }),
    prisma.item.count({
      where: {
        userId,
      },
    }),
    prisma.collection.count({
      where: {
        userId,
      },
    }),
  ]);

  const plan = user?.plan ?? "FREE";

  return {
    plan,
    isPro: isProPlan(plan),
    totalItems,
    totalCollections,
  };
}
