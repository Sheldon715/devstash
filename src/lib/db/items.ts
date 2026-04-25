import { prisma } from "@/lib/prisma";
import { deleteR2Object } from "@/lib/storage/r2";
import { isUploadKeyOwnedByUser, type UploadedFileMetadata } from "@/lib/uploads";
import { normalizeDashboardQueryLimit } from "@/lib/dashboard-query";
import {
  getDashboardItemTypeKeys,
  normalizeDashboardItemTypeKey,
  normalizeDashboardItemTypeRouteKey,
} from "@/lib/item-types";
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
  fileName: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: Date;
}

export interface DashboardItemStats {
  totalItems: number;
  favoriteItems: number;
}

export interface DashboardItemDetailTagRecord {
  color: string | null;
  name: string;
}

export interface DashboardItemDetailRecord {
  id: string;
  title: string;
  description: string;
  contentMode: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  language: string | null;
  aiSummary: string | null;
  collectionNames: string[];
  tags: DashboardItemDetailTagRecord[];
  isPinned: boolean;
  isFavorite: boolean;
  typeKey: DashboardItemTypeKey;
  typeLabel: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
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

export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

export type CreatableItemTypeKey = DashboardItemTypeKey;

export interface CreateItemData {
  typeKey: CreatableItemTypeKey;
  title: string;
  description: string | null;
  content: string | null;
  file: UploadedFileMetadata | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

export interface DownloadableItemFileRecord {
  fileKey: string;
  fileMimeType: string;
  fileName: string;
  fileSizeBytes: number;
  typeKey: DashboardItemTypeKey;
}

const dashboardItemDetailSelect = {
  id: true,
  title: true,
  description: true,
  contentMode: true,
  content: true,
  url: true,
  fileName: true,
  fileUrl: true,
  fileMimeType: true,
  fileSizeBytes: true,
  language: true,
  aiSummary: true,
  isPinned: true,
  isFavorite: true,
  createdAt: true,
  updatedAt: true,
  lastAccessedAt: true,
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
          color: true,
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
    orderBy: {
      sortOrder: "asc",
    },
  },
} as const;

type DashboardItemDetailWithRelations = NonNullable<
  Awaited<ReturnType<typeof getDashboardItemDetailQuery>>
>;

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
      fileName: true,
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

async function getDashboardItemDetailQuery(userId: string, itemId: string) {
  return prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: dashboardItemDetailSelect,
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
  const normalizedTypeKey = normalizeDashboardItemTypeRouteKey(typeKey);

  if (!normalizedTypeKey) {
    return null;
  }

  const itemType = await prisma.itemType.findFirst({
    where: {
      isSystem: true,
      key: normalizedTypeKey,
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

export async function getDashboardItemDetail(userId: string, itemId: string) {
  const item = await getDashboardItemDetailQuery(userId, itemId);

  if (!item) {
    return null;
  }

  return mapItemToDashboardDetailRecord(item);
}

export async function getDownloadableItemFile(
  userId: string,
  itemId: string,
): Promise<DownloadableItemFileRecord | null> {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
      contentMode: "FILE",
      fileKey: {
        not: null,
      },
    },
    select: {
      fileKey: true,
      fileMimeType: true,
      fileName: true,
      fileSizeBytes: true,
      type: {
        select: {
          key: true,
        },
      },
    },
  });

  if (!item || !item.fileKey || !item.fileMimeType || !item.fileName || item.fileSizeBytes === null) {
    return null;
  }

  return {
    fileKey: item.fileKey,
    fileMimeType: item.fileMimeType,
    fileName: item.fileName,
    fileSizeBytes: item.fileSizeBytes,
    typeKey: normalizeDashboardItemTypeKey(item.type.key),
  };
}

export async function isItemFileKeyInUse(userId: string, fileKey: string): Promise<boolean> {
  const matchingItem = await prisma.item.findFirst({
    where: {
      userId,
      fileKey,
    },
    select: {
      id: true,
    },
  });

  return Boolean(matchingItem);
}

export async function createItem(
  userId: string,
  data: CreateItemData,
): Promise<DashboardItemDetailRecord | null> {
  const itemType = await prisma.itemType.findFirst({
    where: {
      key: data.typeKey,
      isSystem: true,
    },
    select: {
      id: true,
      contentMode: true,
    },
  });

  if (!itemType) {
    return null;
  }

  const tagNames = [...new Set(data.tags)];
  const createdItem = await prisma.item.create({
    data: {
      userId,
      typeId: itemType.id,
      title: data.title,
      description: data.description,
      contentMode: itemType.contentMode,
      content: data.content,
      fileKey: itemType.contentMode === "FILE" ? data.file?.fileKey ?? null : null,
      fileName: itemType.contentMode === "FILE" ? data.file?.fileName ?? null : null,
      fileMimeType: itemType.contentMode === "FILE" ? data.file?.fileMimeType ?? null : null,
      fileSizeBytes: itemType.contentMode === "FILE" ? data.file?.fileSizeBytes ?? null : null,
      fileUrl: itemType.contentMode === "FILE" ? data.file?.fileUrl ?? null : null,
      url: data.url,
      language: data.language,
      tags: {
        create: tagNames.map((name) => ({
          tag: {
            connectOrCreate: {
              where: {
                userId_name: {
                  userId,
                  name,
                },
              },
              create: {
                userId,
                name,
              },
            },
          },
        })),
      },
    },
    select: dashboardItemDetailSelect,
  });

  return mapItemToDashboardDetailRecord(createdItem);
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemData,
): Promise<DashboardItemDetailRecord | null> {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: {
      id: true,
      fileKey: true,
    },
  });

  if (!item) {
    return null;
  }

  const tagNames = [...new Set(data.tags)];
  const updatedItem = await prisma.item.update({
    where: {
      id: itemId,
    },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        deleteMany: {},
        create: tagNames.map((name) => ({
          tag: {
            connectOrCreate: {
              where: {
                userId_name: {
                  userId,
                  name,
                },
              },
              create: {
                userId,
                name,
              },
            },
          },
        })),
      },
    },
    select: dashboardItemDetailSelect,
  });

  return mapItemToDashboardDetailRecord(updatedItem);
}

export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: {
      id: true,
      fileKey: true,
    },
  });

  if (!item) {
    return false;
  }

  if (item.fileKey && isUploadKeyOwnedByUser(item.fileKey, userId)) {
    await deleteR2Object(item.fileKey);
  }

  await prisma.item.delete({
    where: {
      id: itemId,
    },
  });

  return true;
}

function mapItemToDashboardDetailRecord(
  item: DashboardItemDetailWithRelations,
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
    fileName: item.fileName,
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
