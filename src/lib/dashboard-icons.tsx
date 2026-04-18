import type { LucideIcon } from "lucide-react";
import {
  Code2,
  File,
  FileImage,
  FileText,
  FolderOpen,
  ImageIcon,
  Link2,
  Sparkles,
  StickyNote,
  TerminalSquare,
} from "lucide-react";

import type { DashboardItemTypeKey } from "@/lib/mock-data";

const ITEM_TYPE_ICON_BY_KEY: Record<DashboardItemTypeKey, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  command: TerminalSquare,
  note: FileText,
  file: FolderOpen,
  image: ImageIcon,
  link: Link2,
};

const ITEM_TYPE_ICON_BY_NAME: Record<string, LucideIcon> = {
  code: Code2,
  Code: Code2,
  sparkles: Sparkles,
  Sparkles,
  terminal: TerminalSquare,
  Terminal: TerminalSquare,
  "file-text": FileText,
  StickyNote,
  paperclip: FolderOpen,
  File,
  image: FileImage,
  Image: ImageIcon,
  link: Link2,
  Link: Link2,
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

export function getDashboardIconByName(iconName?: string | null) {
  return ITEM_TYPE_ICON_BY_NAME[iconName ?? ""] ?? FileText;
}

export function getDashboardItemTypeColor(typeKey: DashboardItemTypeKey) {
  return ITEM_TYPE_COLOR_BY_KEY[typeKey];
}
