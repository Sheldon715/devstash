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

const DASHBOARD_ITEM_TYPE_ROUTE_ALIASES: Record<string, DashboardItemTypeKey> = {
  snippet: "snippet",
  snippets: "snippet",
  prompt: "prompt",
  prompts: "prompt",
  command: "command",
  commands: "command",
  note: "note",
  notes: "note",
  file: "file",
  files: "file",
  image: "image",
  images: "image",
  link: "link",
  links: "link",
  url: "link",
  urls: "link",
};

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

export function normalizeDashboardItemTypeRouteKey(key: string): DashboardItemTypeKey | null {
  return DASHBOARD_ITEM_TYPE_ROUTE_ALIASES[key.toLowerCase()] ?? null;
}

export function getDashboardItemTypeRouteSegment(typeKey: DashboardItemTypeKey) {
  return `${typeKey}s`;
}
