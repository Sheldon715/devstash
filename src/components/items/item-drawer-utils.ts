import type {
  EditItemFormState,
  SerializedDashboardItemDetailRecord,
} from "@/components/items/item-drawer-types";

export function getItemCopyValue(item: SerializedDashboardItemDetailRecord) {
  return item.content ?? item.url ?? item.fileUrl ?? item.description ?? item.title;
}

export function isCodeEditorItemType(typeKey: string) {
  return typeKey === "command" || typeKey === "snippet";
}

export function isMarkdownEditorItemType(typeKey: string) {
  return typeKey === "note" || typeKey === "prompt";
}

export function createEditItemFormState(
  item: SerializedDashboardItemDetailRecord,
): EditItemFormState {
  return {
    title: item.title,
    description: item.description === "No description yet." ? "" : item.description,
    tags: item.tags.map((tag) => tag.name).join(", "),
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
  };
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

export function formatCollectionSummary(collectionNames: string[]) {
  if (!collectionNames.length) {
    return "None";
  }

  return collectionNames.join(", ");
}

export function formatContentModeLabel(
  contentMode: SerializedDashboardItemDetailRecord["contentMode"],
) {
  switch (contentMode) {
    case "TEXT":
      return "Text";
    case "FILE":
      return "File";
    case "URL":
      return "URL";
    default:
      return "Item";
  }
}

export function getPrimaryContentSectionLabel(
  contentMode: SerializedDashboardItemDetailRecord["contentMode"],
) {
  switch (contentMode) {
    case "TEXT":
      return "Content";
    case "FILE":
      return "File";
    case "URL":
      return "Link";
    default:
      return "Details";
  }
}

export function formatDetailTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
