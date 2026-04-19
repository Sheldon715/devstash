import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeDashboardQueryLimit } from "@/lib/dashboard-query";
import { normalizeDashboardItemTypeKey } from "@/lib/item-types";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

const DASHBOARD_DEMO_EMAIL = "demo@devstash.io";

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

async function getCollectionsForDashboard() {
  return prisma.$queryRaw<DashboardCollectionSummaryRow[]>(Prisma.sql`
    WITH filtered_collections AS (
      SELECT
        c.id,
        c.name,
        c.description,
        c."isFavorite",
        c."updatedAt"
      FROM "Collection" c
      INNER JOIN "User" u ON u.id = c."userId"
      WHERE u.email = ${DASHBOARD_DEMO_EMAIL}
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

export async function getAllDashboardCollections() {
  const collections = await getCollectionsForDashboard();

  return collections.map(mapCollectionToCardRecord);
}

export async function getRecentDashboardCollections(limit = 6) {
  const collections = await getAllDashboardCollections();

  return collections.slice(0, normalizeDashboardQueryLimit(limit));
}

export async function getDashboardSidebarCollections(
  limit = 4,
): Promise<DashboardSidebarCollections> {
  const collections = await getAllDashboardCollections();
  const normalizedLimit = normalizeDashboardQueryLimit(limit);

  return {
    favoriteCollections: collections
      .filter((collection) => collection.isFavorite)
      .slice(0, normalizedLimit),
    recentCollections: collections.slice(0, normalizedLimit),
  };
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
  collection: DashboardCollectionSummaryRow,
): DashboardCollectionCardRecord {
  const typeStats = parseCollectionTypeStats(collection.typeStats);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "No description yet.",
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
