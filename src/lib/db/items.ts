import { prisma } from "@/lib/prisma";
import { normalizeDashboardQueryLimit } from "@/lib/dashboard-query";
import { normalizeDashboardItemTypeKey, getDashboardItemTypeKeys } from "@/lib/item-types";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

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

export interface DashboardSidebarItemTypeRecord {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  totalItems: number;
  typeKey: DashboardItemTypeKey;
}

export interface DashboardItemTypePageRecord {
  key: string;
  name: string;
  icon: string | null;
  totalItems: number;
  typeKey: DashboardItemTypeKey;
}

async function getDashboardItems(
  userId: string,
  options?: {
    isPinned?: boolean;
    limit?: number;
    typeKey?: string;
  },
) {
  return prisma.item.findMany({
    where: {
      userId,
      ...(options?.isPinned === undefined ? {} : { isPinned: options.isPinned }),
      ...(options?.typeKey ? { type: { key: options.typeKey } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: normalizeDashboardQueryLimit(options?.limit),
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

export async function getPinnedDashboardItems(userId: string, limit = 4) {
  const items = await getDashboardItems(userId, {
    isPinned: true,
    limit,
  });

  return items.map(mapItemToDashboardRecord);
}

export async function getRecentDashboardItems(userId: string, limit = 10) {
  const items = await getDashboardItems(userId, {
    limit,
  });

  return items.map(mapItemToDashboardRecord);
}

export async function getDashboardItemStats(userId: string): Promise<DashboardItemStats> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({
      where: {
        userId,
      },
    }),
    prisma.item.count({
      where: {
        userId,
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalItems,
    favoriteItems,
  };
}

export async function getDashboardSidebarItemTypes(userId: string) {
  const itemTypes = await prisma.itemType.findMany({
    where: {
      isSystem: true,
    },
    select: {
      id: true,
      key: true,
      name: true,
      icon: true,
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
  });

  return itemTypes
    .map(
      (itemType): DashboardSidebarItemTypeRecord => ({
        id: itemType.id,
        key: itemType.key,
        name: formatItemTypeLabel(itemType.name),
        icon: itemType.icon,
        totalItems: itemType._count.items,
        typeKey: normalizeDashboardItemTypeKey(itemType.key),
      }),
    )
    .sort(
      (left, right) =>
        getDashboardItemTypeKeys().indexOf(left.typeKey) -
        getDashboardItemTypeKeys().indexOf(right.typeKey),
    );
}

export async function getDashboardItemTypePage(userId: string, typeKey: string) {
  const itemType = await prisma.itemType.findFirst({
    where: {
      isSystem: true,
      key: typeKey,
    },
    select: {
      key: true,
      name: true,
      icon: true,
    },
  });

  if (!itemType) {
    return null;
  }

  const items = await getDashboardItems(userId, {
    typeKey: itemType.key,
  });

  return {
    itemType: {
      key: itemType.key,
      name: formatItemTypeLabel(itemType.name),
      icon: itemType.icon,
      totalItems: items.length,
      typeKey: normalizeDashboardItemTypeKey(itemType.key),
    } satisfies DashboardItemTypePageRecord,
    items: items.map(mapItemToDashboardRecord),
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

function formatItemTypeLabel(typeName: string) {
  if (!typeName) {
    return "Item";
  }

  return typeName.charAt(0).toUpperCase() + typeName.slice(1);
}
