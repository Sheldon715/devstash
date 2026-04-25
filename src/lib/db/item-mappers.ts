import {
  normalizeDashboardItemTypeKey,
} from "@/lib/item-types";
import type {
  DashboardItemDetailRecord,
  DashboardItemRecord,
} from "@/lib/db/item-records";

interface ItemTypeRelation {
  key: string;
  name: string;
}

interface ItemCollectionRelation {
  collection: {
    name: string;
  };
}

interface ItemTagNameRelation {
  tag: {
    name: string;
  };
}

interface ItemDetailTagRelation {
  tag: {
    color: string | null;
    name: string;
  };
}

export interface DashboardItemListRow {
  id: string;
  title: string;
  description: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: ItemTypeRelation;
  tags: ItemTagNameRelation[];
  collections: ItemCollectionRelation[];
}

export interface DashboardItemDetailRow {
  id: string;
  title: string;
  description: string | null;
  contentMode: DashboardItemDetailRecord["contentMode"];
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  language: string | null;
  aiSummary: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
  type: ItemTypeRelation;
  tags: ItemDetailTagRelation[];
  collections: ItemCollectionRelation[];
}

export function mapItemToDashboardDetailRecord(
  item: DashboardItemDetailRow,
): DashboardItemDetailRecord {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "No description yet.",
    contentMode: item.contentMode,
    content: item.content,
    url: item.url,
    fileName: item.fileName,
    fileUrl: item.fileUrl,
    fileMimeType: item.fileMimeType,
    fileSizeBytes: item.fileSizeBytes,
    language: item.language,
    aiSummary: item.aiSummary,
    collectionNames: [...new Set(item.collections.map(({ collection }) => collection.name))],
    tags: item.tags
      .map(({ tag }) => ({
        color: tag.color,
        name: tag.name,
      }))
      .filter(
        (tag, index, tags) =>
          tags.findIndex((candidate) => candidate.name === tag.name) === index,
      )
      .sort((left, right) => left.name.localeCompare(right.name)),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    typeKey: normalizeDashboardItemTypeKey(item.type.key),
    typeLabel: formatItemTypeLabel(item.type.name),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastAccessedAt: item.lastAccessedAt,
  } satisfies DashboardItemDetailRecord;
}

export function mapItemToDashboardRecord(item: DashboardItemListRow): DashboardItemRecord {
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
    fileName: item.fileName,
    fileMimeType: item.fileMimeType,
    fileSizeBytes: item.fileSizeBytes,
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function formatItemTypeLabel(typeName: string) {
  if (!typeName) {
    return "Item";
  }

  return typeName.charAt(0).toUpperCase() + typeName.slice(1);
}
