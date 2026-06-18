import type { UploadItemType } from "@/lib/uploads";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

export type CreatableItemTypeKey = DashboardItemTypeKey;

export const createItemTypes = [
  {
    key: "snippet",
    label: "Snippet",
  },
  {
    key: "prompt",
    label: "Prompt",
  },
  {
    key: "command",
    label: "Command",
  },
  {
    key: "note",
    label: "Note",
  },
  {
    key: "link",
    label: "Link",
  },
  {
    key: "file",
    label: "File",
  },
  {
    key: "image",
    label: "Image",
  },
] as const satisfies readonly { key: CreatableItemTypeKey; label: string }[];

export function getContentPlaceholder(typeKey: CreatableItemTypeKey) {
  switch (typeKey) {
    case "command":
      return "Command text";
    case "prompt":
      return "Prompt text";
    case "note":
      return "Note text";
    case "snippet":
      return "Code snippet";
    case "link":
    case "file":
    case "image":
      return "";
    default:
      return "";
  }
}

export function normalizeCreatableItemType(typeKey: CreatableItemTypeKey) {
  return createItemTypes.some((itemType) => itemType.key === typeKey) ? typeKey : "snippet";
}

export function isCodeEditorItemType(typeKey: CreatableItemTypeKey) {
  return typeKey === "command" || typeKey === "snippet";
}

export function isMarkdownEditorItemType(typeKey: CreatableItemTypeKey) {
  return typeKey === "note" || typeKey === "prompt";
}

export function isUploadItemType(typeKey: CreatableItemTypeKey): typeKey is UploadItemType {
  return typeKey === "file" || typeKey === "image";
}

export function isProItemType(typeKey: CreatableItemTypeKey) {
  return typeKey === "file" || typeKey === "image";
}

export function parseTagsInput(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}
