import { prisma } from "@/lib/prisma";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

const DASHBOARD_DEMO_EMAIL = "demo@devstash.io";

type CollectionWithItems = Awaited<ReturnType<typeof getCollectionsForDashboard>>[number];

export interface DashboardCollectionCardRecord {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeCount: number;
  dominantTypeKey: DashboardItemTypeKey | null;
  typeKeys: DashboardItemTypeKey[];
  lastUpdatedAt: Date | null;
}

export interface DashboardCollectionStats {
  totalCollections: number;
  favoriteCollections: number;
}

async function getCollectionsForDashboard() {
  return prisma.collection.findMany({
    where: {
      user: {
        email: DASHBOARD_DEMO_EMAIL,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
      items: {
        select: {
          item: {
            select: {
              updatedAt: true,
              type: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getRecentDashboardCollections(limit = 6) {
  const collections = await getCollectionsForDashboard();

  return collections
    .map(mapCollectionToCardRecord)
    .sort((left, right) => {
      const rightTimestamp = right.lastUpdatedAt?.getTime() ?? 0;
      const leftTimestamp = left.lastUpdatedAt?.getTime() ?? 0;

      return rightTimestamp - leftTimestamp;
    })
    .slice(0, limit);
}

export async function getDashboardCollectionStats(): Promise<DashboardCollectionStats> {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({
      where: {
        user: {
          email: DASHBOARD_DEMO_EMAIL,
        },
      },
    }),
    prisma.collection.count({
      where: {
        user: {
          email: DASHBOARD_DEMO_EMAIL,
        },
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalCollections,
    favoriteCollections,
  };
}

function mapCollectionToCardRecord(
  collection: CollectionWithItems,
): DashboardCollectionCardRecord {
  const typeCounts = new Map<DashboardItemTypeKey, number>();
  let lastUpdatedAt: Date | null = collection.updatedAt;

  for (const collectionItem of collection.items) {
    const typeKey = collectionItem.item.type.key as DashboardItemTypeKey;
    const nextCount = (typeCounts.get(typeKey) ?? 0) + 1;

    typeCounts.set(typeKey, nextCount);

    const itemUpdatedAt = collectionItem.item.updatedAt;

    if (!lastUpdatedAt || itemUpdatedAt > lastUpdatedAt) {
      lastUpdatedAt = itemUpdatedAt;
    }
  }

  const sortedTypes = [...typeCounts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "No description yet.",
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    typeCount: typeCounts.size,
    dominantTypeKey: sortedTypes[0]?.[0] ?? null,
    typeKeys: sortedTypes.map(([typeKey]) => typeKey),
    lastUpdatedAt,
  };
}
