"use server";

import { z } from "zod";

import {
  actionFailure,
  actionSuccess,
  getActionUserId,
  getZodErrorMessage,
  nonEmptyIdSchema,
  runOwnedMutation,
  type ActionResult,
} from "@/actions/_shared";
import { getUserBillingUsage } from "@/lib/billing/usage";
import { canCreateItem } from "@/lib/billing/usage-limits";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  toggleItemFavorite as toggleItemFavoriteRecord,
  toggleItemPin as toggleItemPinRecord,
  updateItem as updateItemRecord,
  type CreatableItemTypeKey,
  type DashboardItemDetailRecord,
} from "@/lib/db/items";
import {
  isUploadKeyForItemType,
  validateUploadFileMetadata,
} from "@/lib/uploads";

type SerializedDashboardItemDetailRecord = Omit<
  DashboardItemDetailRecord,
  "createdAt" | "lastAccessedAt" | "updatedAt"
> & {
  createdAt: string;
  lastAccessedAt: string | null;
  updatedAt: string;
};
const itemIdSchema = nonEmptyIdSchema("Item not found.");

export type UpdateItemResult = ActionResult<SerializedDashboardItemDetailRecord>;
export type ToggleItemFavoriteResult = UpdateItemResult;
export type ToggleItemPinResult = UpdateItemResult;
export type CreateItemResult = ActionResult<SerializedDashboardItemDetailRecord>;
export type DeleteItemResult = ActionResult<{ id: string }>;

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((value) => {
    if (!value) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid URL.")
  .transform((value) => (value ? value : null));

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: optionalTextSchema,
  content: optionalTextSchema,
  url: optionalUrlSchema,
  language: optionalTextSchema,
  tags: z
    .array(z.string().trim().min(1, "Tags cannot be empty."))
    .transform((tags) => [...new Set(tags)]),
  collectionIds: z
    .array(z.string().trim().min(1, "Collections cannot be empty."))
    .optional()
    .transform((collectionIds) =>
      collectionIds ? [...new Set(collectionIds)] : undefined,
    ),
});

const creatableItemTypeKeys = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

const createItemSchema = updateItemSchema
  .extend({
    typeKey: z.enum(creatableItemTypeKeys),
    file: z
      .object({
        fileKey: z.string().trim().min(1, "Upload a file first."),
        fileUrl: z.string().trim().url().nullable(),
        fileName: z.string().trim().min(1, "File name is required."),
        fileMimeType: z.string().trim().min(1, "File type is required."),
        fileSizeBytes: z.number().int().positive("File size is required."),
      })
      .optional()
      .nullable(),
  })
  .superRefine((data, context) => {
    if (data.typeKey === "link" && !data.url) {
      context.addIssue({
        code: "custom",
        message: "URL is required for link items.",
        path: ["url"],
      });
    }

    if ((data.typeKey === "file" || data.typeKey === "image") && !data.file) {
      context.addIssue({
        code: "custom",
        message: "Upload a file first.",
        path: ["file"],
      });
    }

    if ((data.typeKey === "file" || data.typeKey === "image") && data.file) {
      const validation = validateUploadFileMetadata({
        fileName: data.file.fileName,
        itemType: data.typeKey,
        mimeType: data.file.fileMimeType,
        sizeBytes: data.file.fileSizeBytes,
      });

      if (validation.error) {
        context.addIssue({
          code: "custom",
          message: validation.error,
          path: ["file"],
        });
      }
    }
  });

export async function createItem(data: unknown): Promise<CreateItemResult> {
  const parsedData = createItemSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure("You need to be signed in to create items.");
  }

  const usage = await getUserBillingUsage(userId);
  const limit = canCreateItem(usage.plan, usage.totalItems);

  if (!limit.allowed) {
    return actionFailure(limit.message ?? "Upgrade to Pro to save more items.");
  }

  if (!usage.isPro && isUploadItemTypeKey(parsedData.data.typeKey)) {
    return actionFailure("File and image items require DevStash Pro.");
  }

  const payload = normalizeCreateItemPayload(parsedData.data, userId);

  if (!payload) {
    return actionFailure("Upload a file first.");
  }

  const createdItem = await createItemRecord(userId, payload);

  if (!createdItem) {
    return actionFailure("Item type not found.");
  }

  return actionSuccess(serializeItemDetail(createdItem));
}

export async function updateItem(itemId: string, data: unknown): Promise<UpdateItemResult> {
  const parsedData = updateItemSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  return runOwnedMutation({
    id: itemId,
    idSchema: itemIdSchema,
    unauthorizedError: "You need to be signed in to update items.",
    notFoundError: "Item not found.",
    mutate: (userId, normalizedItemId) =>
      updateItemRecord(userId, normalizedItemId, parsedData.data),
    serialize: (record) => serializeItemDetail(record),
  });
}

export async function toggleItemFavorite(
  itemId: string,
): Promise<ToggleItemFavoriteResult> {
  return runOwnedMutation({
    id: itemId,
    idSchema: itemIdSchema,
    unauthorizedError: "You need to be signed in to update items.",
    notFoundError: "Item not found.",
    mutate: toggleItemFavoriteRecord,
    serialize: (record) => serializeItemDetail(record),
  });
}

export async function toggleItemPin(
  itemId: string,
): Promise<ToggleItemPinResult> {
  return runOwnedMutation({
    id: itemId,
    idSchema: itemIdSchema,
    unauthorizedError: "You need to be signed in to update items.",
    notFoundError: "Item not found.",
    mutate: toggleItemPinRecord,
    serialize: (record) => serializeItemDetail(record),
  });
}

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  return runOwnedMutation({
    id: itemId,
    idSchema: itemIdSchema,
    unauthorizedError: "You need to be signed in to delete items.",
    notFoundError: "Item not found.",
    mutate: deleteItemRecord,
    serialize: (_record, normalizedItemId) => ({
      id: normalizedItemId,
    }),
  });
}

function normalizeCreateItemPayload(data: z.infer<typeof createItemSchema>, userId: string) {
  const textContentTypes: CreatableItemTypeKey[] = ["snippet", "prompt", "command", "note"];
  const languageTypes: CreatableItemTypeKey[] = ["snippet", "command"];
  const uploadItemType = data.typeKey === "file" || data.typeKey === "image" ? data.typeKey : null;
  const file = uploadItemType ? data.file ?? null : null;

  if (file && uploadItemType && !isUploadKeyForItemType(file.fileKey, userId, uploadItemType)) {
    return null;
  }

  return {
    typeKey: data.typeKey,
    title: data.title,
    description: data.description,
    content: textContentTypes.includes(data.typeKey) ? data.content : null,
    file,
    url: data.typeKey === "link" ? data.url : null,
    language: languageTypes.includes(data.typeKey) ? data.language : null,
    tags: data.tags,
    collectionIds: data.collectionIds ?? [],
  };
}

function isUploadItemTypeKey(typeKey: CreatableItemTypeKey) {
  return typeKey === "file" || typeKey === "image";
}

function serializeItemDetail(record: DashboardItemDetailRecord): SerializedDashboardItemDetailRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastAccessedAt: record.lastAccessedAt?.toISOString() ?? null,
  };
}
