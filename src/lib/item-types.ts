import type { DashboardItemTypeKey } from "@/lib/mock-data";

const DASHBOARD_ITEM_TYPE_KEYS = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const satisfies readonly DashboardItemTypeKey[];

export function getDashboardItemTypeKeys() {
  return DASHBOARD_ITEM_TYPE_KEYS;
}

export function normalizeDashboardItemTypeKey(key: string): DashboardItemTypeKey {
  if (key === "url") {
    return "link";
  }

  if (DASHBOARD_ITEM_TYPE_KEYS.includes(key as DashboardItemTypeKey)) {
    return key as DashboardItemTypeKey;
  }

  return "note";
}
