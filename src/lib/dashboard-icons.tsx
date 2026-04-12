import type { LucideIcon } from "lucide-react";
import {
  Code2,
  FileImage,
  FileText,
  FolderOpen,
  ImageIcon,
  Link2,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

import type { DashboardItemType, DashboardItemTypeKey } from "@/lib/mock-data";

const ITEM_TYPE_ICON_BY_KEY: Record<DashboardItemTypeKey, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  command: TerminalSquare,
  note: FileText,
  file: FolderOpen,
  image: ImageIcon,
  link: Link2,
};

const ITEM_TYPE_ICON_BY_NAME: Record<DashboardItemType["icon"], LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: TerminalSquare,
  "file-text": FileText,
  paperclip: FolderOpen,
  image: FileImage,
  link: Link2,
};

const ITEM_TYPE_COLOR_BY_KEY: Record<DashboardItemTypeKey, string> = {
  snippet: "text-[#3b82f6]",
  prompt: "text-[#8b5cf6]",
  command: "text-[#f97316]",
  note: "text-[#fde047]",
  file: "text-[#94a3b8]",
  image: "text-[#ec4899]",
  link: "text-[#14b8a6]",
};

export function getDashboardItemTypeIcon(typeKey: DashboardItemTypeKey) {
  return ITEM_TYPE_ICON_BY_KEY[typeKey];
}

export function getDashboardIconByName(iconName: DashboardItemType["icon"]) {
  return ITEM_TYPE_ICON_BY_NAME[iconName];
}

export function getDashboardItemTypeColor(typeKey: DashboardItemTypeKey) {
  return ITEM_TYPE_COLOR_BY_KEY[typeKey];
}
