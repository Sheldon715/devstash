import { prisma } from "@/lib/prisma";
import { formatItemTypeLabel } from "@/lib/db/item-mappers";
import type { DashboardCollectionCardRecord } from "@/lib/db/collections";
import type { DashboardItemTypeKey } from "@/lib/mock-data";
import { normalizeDashboardItemTypeKey } from "@/lib/item-types";

const SEARCH_PREVIEW_MAX_LENGTH = 160;

export interface DashboardSearchItemRecord {
  id: string;
  title: string;
  typeKey: DashboardItemTypeKey;
  typeLabel: string;
  contentPreview: string;
}

export interface DashboardSearchCollectionRecord {
  id: string;
  name: string;
  itemCount: number;
}

export interface DashboardSearchData {
  items: DashboardSearchItemRecord[];
  collections: DashboardSearchCollectionRecord[];
}

export async function getDashboardSearchItems(
  userId: string,
): Promise<DashboardSearchItemRecord[]> {
  const items = await prisma.item.findMany({
    where: {
      userId,
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      fileName: true,
      type: {
        select: {
          key: true,
          name: true,
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    typeKey: normalizeDashboardItemTypeKey(item.type.key),
    typeLabel: formatItemTypeLabel(item.type.name),
    contentPreview: getSearchPreview([
      item.description,
      item.content,
      item.url,
      item.fileName,
    ]),
  }));
}

export function mapCollectionsToDashboardSearchRecords(
  collections: DashboardCollectionCardRecord[],
): DashboardSearchCollectionRecord[] {
  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    itemCount: collection.itemCount,
  }));
}

export function getSearchPreview(values: Array<string | null | undefined>) {
  const value =
    values
      .find((candidate) => candidate?.trim())
      ?.replace(/\s+/g, " ")
      .trim() ?? "";

  if (value.length <= SEARCH_PREVIEW_MAX_LENGTH) {
    return value;
  }

  return `${value.slice(0, SEARCH_PREVIEW_MAX_LENGTH - 1).trimEnd()}...`;
}
