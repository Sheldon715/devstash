import { prisma } from "@/lib/prisma";
import { deleteR2Object } from "@/lib/storage/r2";
import { isUploadKeyOwnedByUser } from "@/lib/uploads";
import { normalizeDashboardQueryLimit } from "@/lib/dashboard-query";
import {
  getDashboardItemTypeKeys,
  normalizeDashboardItemTypeKey,
  normalizeDashboardItemTypeRouteKey,
} from "@/lib/item-types";
import {
  formatItemTypeLabel,
  mapItemToDashboardDetailRecord,
  mapItemToDashboardRecord,
} from "@/lib/db/item-mappers";
import { dashboardItemDetailSelect } from "@/lib/db/item-selects";
import type {
  CreateItemData,
  DashboardItemDetailRecord,
  DashboardItemStats,
  DashboardItemTypePageRecord,
  DashboardSidebarItemTypeRecord,
  DownloadableItemFileRecord,
  UpdateItemData,
} from "@/lib/db/item-records";

export type {
  CreatableItemTypeKey,
  CreateItemData,
  DashboardItemDetailRecord,
  DashboardItemDetailTagRecord,
  DashboardItemRecord,
  DashboardItemStats,
  DashboardItemTypePageRecord,
  DashboardSidebarItemTypeRecord,
  DownloadableItemFileRecord,
  UpdateItemData,
} from "@/lib/db/item-records";

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
  const collectionIds = await getOwnedCollectionIds(userId, data.collectionIds);
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
      ...(collectionIds.length
        ? {
            collections: {
              create: collectionIds.map((collectionId, index) => ({
                collection: {
                  connect: {
                    id: collectionId,
                  },
                },
                sortOrder: index,
              })),
            },
          }
        : {}),
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
  const collectionIds =
    data.collectionIds === undefined
      ? undefined
      : await getOwnedCollectionIds(userId, data.collectionIds);
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
      ...(collectionIds === undefined
        ? {}
        : {
            collections: {
              deleteMany: {},
              create: collectionIds.map((collectionId, index) => ({
                collection: {
                  connect: {
                    id: collectionId,
                  },
                },
                sortOrder: index,
              })),
            },
          }),
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

async function getOwnedCollectionIds(userId: string, collectionIds: string[]) {
  const uniqueCollectionIds = [...new Set(collectionIds)];

  if (!uniqueCollectionIds.length) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      id: {
        in: uniqueCollectionIds,
      },
      userId,
    },
    select: {
      id: true,
    },
  });
  const ownedCollectionIds = new Set(collections.map((collection) => collection.id));

  return uniqueCollectionIds.filter((collectionId) => ownedCollectionIds.has(collectionId));
}
