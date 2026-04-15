import { dashboardMockData, type DashboardItemTypeKey } from "@/lib/mock-data";

export type DashboardCollectionRecord =
  (typeof dashboardMockData.collections)[number];
export type DashboardItemRecord = (typeof dashboardMockData.items)[number];

export function getRecentCollections(limit = 6) {
  return [...dashboardMockData.collections]
    .sort((left, right) => {
      return getLatestCollectionUpdate(right.itemIds).localeCompare(
        getLatestCollectionUpdate(left.itemIds)
      );
    })
    .slice(0, limit);
}

export function getPinnedItems() {
  return [...dashboardMockData.items]
    .filter((item) => item.isPinned)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getRecentItems(limit = 10) {
  return [...dashboardMockData.items]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit);
}

export function getFavoriteItemsCount() {
  return dashboardMockData.items.filter((item) => item.isFavorite).length;
}

export function getFavoriteCollectionsCount() {
  return dashboardMockData.collections.filter((collection) => collection.isFavorite)
    .length;
}

export function getCollectionItems(itemIds: readonly string[]): DashboardItemRecord[] {
  return itemIds
    .map((itemId) => dashboardMockData.items.find((item) => item.id === itemId))
    .filter((item): item is DashboardItemRecord => Boolean(item));
}

export function getCollectionNames(collectionIds: readonly string[]) {
  return collectionIds
    .map(
      (collectionId) =>
        dashboardMockData.collections.find(
          (collection) => collection.id === collectionId
        )?.name
    )
    .filter((value): value is string => Boolean(value));
}

export function getUniqueItemTypes(items: DashboardItemRecord[]) {
  return [...new Set(items.map((item) => item.typeKey))] as DashboardItemTypeKey[];
}

export function formatShortDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getLatestCollectionUpdate(itemIds: readonly string[]) {
  return itemIds
    .map(
      (itemId) =>
        dashboardMockData.items.find((item) => item.id === itemId)?.updatedAt ?? ""
    )
    .sort((left, right) => right.localeCompare(left))[0];
}
