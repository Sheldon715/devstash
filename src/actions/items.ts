"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
  type CreatableItemTypeKey,
  type DashboardItemDetailRecord,
} from "@/lib/db/items";

type SerializedDashboardItemDetailRecord = Omit<
  DashboardItemDetailRecord,
  "createdAt" | "lastAccessedAt" | "updatedAt"
> & {
  createdAt: string;
  lastAccessedAt: string | null;
  updatedAt: string;
};

interface UpdateItemSuccess {
  success: true;
  data: SerializedDashboardItemDetailRecord;
  error: null;
}

interface UpdateItemFailure {
  success: false;
  data: null;
  error: string;
}

export type UpdateItemResult = UpdateItemSuccess | UpdateItemFailure;

interface CreateItemSuccess {
  success: true;
  data: SerializedDashboardItemDetailRecord;
  error: null;
}

interface CreateItemFailure {
  success: false;
  data: null;
  error: string;
}

export type CreateItemResult = CreateItemSuccess | CreateItemFailure;

interface DeleteItemSuccess {
  success: true;
  data: {
    id: string;
  };
  error: null;
}

interface DeleteItemFailure {
  success: false;
  data: null;
  error: string;
}

export type DeleteItemResult = DeleteItemSuccess | DeleteItemFailure;

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
});

const creatableItemTypeKeys = ["snippet", "prompt", "command", "note", "link"] as const;

const createItemSchema = updateItemSchema
  .extend({
    typeKey: z.enum(creatableItemTypeKeys),
  })
  .superRefine((data, context) => {
    if (data.typeKey === "link" && !data.url) {
      context.addIssue({
        code: "custom",
        message: "URL is required for link items.",
        path: ["url"],
      });
    }
  });

export async function createItem(data: unknown): Promise<CreateItemResult> {
  const parsedData = createItemSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      data: null,
      error: parsedData.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to create items.",
    };
  }

  const payload = normalizeCreateItemPayload(parsedData.data);
  const createdItem = await createItemRecord(session.user.id, payload);

  if (!createdItem) {
    return {
      success: false,
      data: null,
      error: "Item type not found.",
    };
  }

  return {
    success: true,
    data: serializeItemDetail(createdItem),
    error: null,
  };
}

export async function updateItem(itemId: string, data: unknown): Promise<UpdateItemResult> {
  const parsedData = updateItemSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      data: null,
      error: parsedData.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to update items.",
    };
  }

  const updatedItem = await updateItemRecord(session.user.id, itemId, parsedData.data);

  if (!updatedItem) {
    return {
      success: false,
      data: null,
      error: "Item not found.",
    };
  }

  return {
    success: true,
    data: serializeItemDetail(updatedItem),
    error: null,
  };
}

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const parsedItemId = z.string().trim().min(1).safeParse(itemId);

  if (!parsedItemId.success) {
    return {
      success: false,
      data: null,
      error: "Item not found.",
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to delete items.",
    };
  }

  const deletedItem = await deleteItemRecord(session.user.id, parsedItemId.data);

  if (!deletedItem) {
    return {
      success: false,
      data: null,
      error: "Item not found.",
    };
  }

  return {
    success: true,
    data: {
      id: parsedItemId.data,
    },
    error: null,
  };
}

function normalizeCreateItemPayload(data: z.infer<typeof createItemSchema>) {
  const textContentTypes: CreatableItemTypeKey[] = ["snippet", "prompt", "command", "note"];
  const languageTypes: CreatableItemTypeKey[] = ["snippet", "command"];

  return {
    typeKey: data.typeKey,
    title: data.title,
    description: data.description,
    content: textContentTypes.includes(data.typeKey) ? data.content : null,
    url: data.typeKey === "link" ? data.url : null,
    language: languageTypes.includes(data.typeKey) ? data.language : null,
    tags: data.tags,
  };
}

function serializeItemDetail(record: DashboardItemDetailRecord): SerializedDashboardItemDetailRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastAccessedAt: record.lastAccessedAt?.toISOString() ?? null,
  };
}
