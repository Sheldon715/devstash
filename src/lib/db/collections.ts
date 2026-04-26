import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeDashboardQueryLimit } from "@/lib/dashboard-query";
import { normalizeDashboardItemTypeKey } from "@/lib/item-types";
import { mapItemToDashboardRecord } from "@/lib/db/item-mappers";
import type { DashboardItemRecord } from "@/lib/db/item-records";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

export interface DashboardCollectionCardRecord {
  id: string;
  name: string;
  description: string;
  descriptionValue: string | null;
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

export interface CreateCollectionData {
  description: string | null;
  name: string;
}

export interface UpdateCollectionData {
  description: string | null;
  name: string;
}

export interface DashboardCollectionMetadataRecord {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
}

export interface DashboardSidebarCollections {
  favoriteCollections: DashboardCollectionCardRecord[];
  recentCollections: DashboardCollectionCardRecord[];
}

interface DashboardCollectionSummaryRow {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  lastUpdatedAt: Date | null;
  typeStats: unknown;
}

interface DashboardCollectionTypeStat {
  itemCount: number;
  typeKey: DashboardItemTypeKey;
}

async function getCollectionsForDashboard(userId: string) {
  return prisma.$queryRaw<DashboardCollectionSummaryRow[]>(Prisma.sql`
    WITH filtered_collections AS (
      SELECT
        c.id,
        c.name,
        c.description,
        c."isFavorite",
        c."updatedAt"
      FROM "Collection" c
      WHERE c."userId" = ${userId}
    ),
    collection_type_stats AS (
      SELECT
        ci."collectionId" AS "collectionId",
        CASE
          WHEN it.key = 'url' THEN 'link'
          WHEN it.key IN ('snippet', 'prompt', 'command', 'note', 'file', 'image', 'link') THEN it.key
          ELSE 'note'
        END AS "typeKey",
        COUNT(*)::int AS "typeItemCount",
        MAX(i."updatedAt") AS "lastItemUpdatedAt"
      FROM "CollectionItem" ci
      INNER JOIN "Item" i ON i.id = ci."itemId"
      INNER JOIN "ItemType" it ON it.id = i."typeId"
      GROUP BY
        ci."collectionId",
        CASE
          WHEN it.key = 'url' THEN 'link'
          WHEN it.key IN ('snippet', 'prompt', 'command', 'note', 'file', 'image', 'link') THEN it.key
          ELSE 'note'
        END
    )
    SELECT
      fc.id,
      fc.name,
      fc.description,
      fc."isFavorite" AS "isFavorite",
      COALESCE(SUM(cts."typeItemCount"), 0)::int AS "itemCount",
      GREATEST(
        fc."updatedAt",
        COALESCE(MAX(cts."lastItemUpdatedAt"), fc."updatedAt")
      ) AS "lastUpdatedAt",
      COALESCE(
        json_agg(
          json_build_object(
            'typeKey', cts."typeKey",
            'itemCount', cts."typeItemCount"
          )
          ORDER BY cts."typeItemCount" DESC, cts."typeKey" ASC
        ) FILTER (WHERE cts."typeKey" IS NOT NULL),
        '[]'::json
      ) AS "typeStats"
    FROM filtered_collections fc
    LEFT JOIN collection_type_stats cts ON cts."collectionId" = fc.id
    GROUP BY
      fc.id,
      fc.name,
      fc.description,
      fc."isFavorite",
      fc."updatedAt"
    ORDER BY "lastUpdatedAt" DESC, fc.name ASC
  `);
}

export async function getAllDashboardCollections(userId: string) {
  const collections = await getCollectionsForDashboard(userId);

  return collections.map(mapCollectionToCardRecord);
}

export async function getRecentDashboardCollections(userId: string, limit = 6) {
  const collections = await getAllDashboardCollections(userId);

  return collections.slice(0, normalizeDashboardQueryLimit(limit));
}

export async function getDashboardSidebarCollections(
  userId: string,
  limit = 4,
): Promise<DashboardSidebarCollections> {
  const collections = await getAllDashboardCollections(userId);
  const normalizedLimit = normalizeDashboardQueryLimit(limit);

  return {
    favoriteCollections: collections
      .filter((collection) => collection.isFavorite)
      .slice(0, normalizedLimit),
    recentCollections: collections.slice(0, normalizedLimit),
  };
}

export async function getDashboardCollectionItems(
  userId: string,
  collectionId: string,
): Promise<DashboardItemRecord[]> {
  const collectionItems = await prisma.collectionItem.findMany({
    where: {
      collectionId,
      collection: {
        userId,
      },
      item: {
        userId,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { addedAt: "asc" }],
    select: {
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          fileMimeType: true,
          fileSizeBytes: true,
          isPinned: true,
          isFavorite: true,
          createdAt: true,
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
      },
    },
  });

  return collectionItems.map(({ item }) => mapItemToDashboardRecord(item));
}

export async function getDashboardCollectionStats(userId: string): Promise<DashboardCollectionStats> {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({
      where: {
        userId,
      },
    }),
    prisma.collection.count({
      where: {
        userId,
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalCollections,
    favoriteCollections,
  };
}

export async function createDashboardCollection(
  userId: string,
  data: CreateCollectionData,
): Promise<DashboardCollectionCardRecord> {
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "No description yet.",
    descriptionValue: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: 0,
    typeCount: 0,
    dominantTypeKey: null,
    typeKeys: [],
    lastUpdatedAt: collection.updatedAt,
  };
}

export async function updateDashboardCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionData,
): Promise<DashboardCollectionMetadataRecord | null> {
  const updatedCollection = await prisma.collection.updateMany({
    where: {
      id: collectionId,
      userId,
    },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  if (updatedCollection.count === 0) {
    return null;
  }

  return prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
    },
  });
}

export async function deleteDashboardCollection(
  userId: string,
  collectionId: string,
): Promise<boolean> {
  const deletedCollection = await prisma.collection.deleteMany({
    where: {
      id: collectionId,
      userId,
    },
  });

  return deletedCollection.count > 0;
}

function mapCollectionToCardRecord(
  collection: DashboardCollectionSummaryRow,
): DashboardCollectionCardRecord {
  const typeStats = parseCollectionTypeStats(collection.typeStats);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "No description yet.",
    descriptionValue: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.itemCount,
    typeCount: typeStats.length,
    dominantTypeKey: typeStats[0]?.typeKey ?? null,
    typeKeys: typeStats.map(({ typeKey }) => typeKey),
    lastUpdatedAt: collection.lastUpdatedAt,
  };
}

function parseCollectionTypeStats(value: unknown): DashboardCollectionTypeStat[] {
  const rawStats = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (JSON.parse(value) as unknown)
      : [];

  if (!Array.isArray(rawStats)) {
    return [];
  }

  return rawStats
    .map((stat): DashboardCollectionTypeStat | null => {
      if (!stat || typeof stat !== "object") {
        return null;
      }

      const typeKey = normalizeDashboardItemTypeKey(
        String(Reflect.get(stat, "typeKey") ?? "note"),
      );
      const itemCount = Number(Reflect.get(stat, "itemCount") ?? 0);

      return {
        itemCount: Number.isFinite(itemCount) ? itemCount : 0,
        typeKey,
      };
    })
    .filter((stat): stat is DashboardCollectionTypeStat => stat !== null);
}
