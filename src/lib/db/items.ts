import { prisma } from "@/lib/prisma";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

const DASHBOARD_DEMO_EMAIL = "demo@devstash.io";
const DASHBOARD_ITEM_TYPE_KEYS = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const satisfies readonly DashboardItemTypeKey[];

type DashboardItemWithRelations = Awaited<
  ReturnType<typeof getDashboardItems>
>[number];

export interface DashboardItemRecord {
  id: string;
  title: string;
  description: string;
  typeKey: DashboardItemTypeKey;
  typeLabel: string;
  collectionNames: string[];
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: Date;
}

export interface DashboardItemStats {
  totalItems: number;
  favoriteItems: number;
}

async function getDashboardItems(
  options?: {
    isPinned?: boolean;
    limit?: number;
  },
) {
  return prisma.item.findMany({
    where: {
      user: {
        email: DASHBOARD_DEMO_EMAIL,
      },
      ...(options?.isPinned === undefined ? {} : { isPinned: options.isPinned }),
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: options?.limit,
    select: {
      id: true,
      title: true,
      description: true,
      isPinned: true,
      isFavorite: true,
      updatedAt: true,
      type: {
        select: {
          key: true,
          name: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
      collections: {
        select: {
          collection: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getPinnedDashboardItems(limit = 4) {
  const items = await getDashboardItems({
    isPinned: true,
    limit,
  });

  return items.map(mapItemToDashboardRecord);
}

export async function getRecentDashboardItems(limit = 10) {
  const items = await getDashboardItems({
    limit,
  });

  return items.map(mapItemToDashboardRecord);
}

export async function getDashboardItemStats(): Promise<DashboardItemStats> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({
      where: {
        user: {
          email: DASHBOARD_DEMO_EMAIL,
        },
      },
    }),
    prisma.item.count({
      where: {
        user: {
          email: DASHBOARD_DEMO_EMAIL,
        },
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalItems,
    favoriteItems,
  };
}

function mapItemToDashboardRecord(item: DashboardItemWithRelations): DashboardItemRecord {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "No description yet.",
    typeKey: normalizeDashboardItemTypeKey(item.type.key),
    typeLabel: formatItemTypeLabel(item.type.name),
    collectionNames: [...new Set(item.collections.map(({ collection }) => collection.name))]
      .sort((left, right) => left.localeCompare(right)),
    tags: [...new Set(item.tags.map(({ tag }) => tag.name))].sort((left, right) =>
      left.localeCompare(right),
    ),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    updatedAt: item.updatedAt,
  };
}

function normalizeDashboardItemTypeKey(key: string): DashboardItemTypeKey {
  if (key === "url") {
    return "link";
  }

  if (DASHBOARD_ITEM_TYPE_KEYS.includes(key as DashboardItemTypeKey)) {
    return key as DashboardItemTypeKey;
  }

  return "note";
}

function formatItemTypeLabel(typeName: string) {
  if (!typeName) {
    return "Item";
  }

  return typeName.charAt(0).toUpperCase() + typeName.slice(1);
}
