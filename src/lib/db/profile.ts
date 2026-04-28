import { prisma } from "@/lib/prisma";
import { getDashboardItemTypeKeys, normalizeDashboardItemTypeKey } from "@/lib/item-types";
import type { DashboardItemTypeKey } from "@/lib/mock-data";
import type { Plan } from "../../../generated/prisma/enums";

export interface ProfileItemTypeStat {
  count: number;
  key: string;
  label: string;
  typeKey: DashboardItemTypeKey;
}

export interface ProfilePageData {
  authProviders: string[];
  createdAt: Date;
  email: string;
  hasPassword: boolean;
  image: string | null;
  itemTypeBreakdown: ProfileItemTypeStat[];
  name: string | null;
  plan: Plan;
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  stripeSubscriptionId: string | null;
  totalCollections: number;
  totalItems: number;
}

function formatProfileItemTypeLabel(key: string, name: string) {
  if (key === "url" || key === "link") {
    return "Links";
  }

  switch (key) {
    case "snippet":
      return "Snippets";
    case "prompt":
      return "Prompts";
    case "command":
      return "Commands";
    case "note":
      return "Notes";
    case "file":
      return "Files";
    case "image":
      return "Images";
    default:
      return name.endsWith("s") ? name : `${name}s`;
  }
}

function formatAuthProviders(providers: string[], hasPassword: boolean) {
  const normalizedProviders = new Set<string>();

  if (hasPassword) {
    normalizedProviders.add("Email password");
  }

  for (const provider of providers) {
    if (provider === "github") {
      normalizedProviders.add("GitHub");
      continue;
    }

    normalizedProviders.add(provider.charAt(0).toUpperCase() + provider.slice(1));
  }

  return [...normalizedProviders];
}

export async function getProfilePageData(userId: string): Promise<ProfilePageData | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
      name: true,
      image: true,
      createdAt: true,
      passwordHash: true,
      plan: true,
      stripeCustomerId: true,
      stripePriceId: true,
      stripeSubscriptionId: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const [totalItems, totalCollections, itemTypes] = await Promise.all([
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
    prisma.itemType.findMany({
      where: {
        isSystem: true,
      },
      select: {
        key: true,
        name: true,
        _count: {
          select: {
            items: {
              where: {
                userId,
              },
            },
          },
        },
      },
    }),
  ]);

  const itemTypeOrder = getDashboardItemTypeKeys();
  const itemTypeBreakdown = itemTypes
    .map((itemType) => ({
      count: itemType._count.items,
      key: itemType.key,
      label: formatProfileItemTypeLabel(itemType.key, itemType.name),
      normalizedKey: normalizeDashboardItemTypeKey(itemType.key),
    }))
    .sort(
      (left, right) =>
        itemTypeOrder.indexOf(left.normalizedKey) - itemTypeOrder.indexOf(right.normalizedKey),
    )
    .map(({ count, key, label, normalizedKey }) => ({
      count,
      key,
      label,
      typeKey: normalizedKey,
    }));

  return {
    authProviders: formatAuthProviders(
      user.accounts.map((account) => account.provider),
      Boolean(user.passwordHash),
    ),
    createdAt: user.createdAt,
    email: user.email,
    hasPassword: Boolean(user.passwordHash),
    image: user.image,
    itemTypeBreakdown,
    name: user.name,
    plan: user.plan,
    stripeCustomerId: user.stripeCustomerId,
    stripePriceId: user.stripePriceId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    totalCollections,
    totalItems,
  };
}
