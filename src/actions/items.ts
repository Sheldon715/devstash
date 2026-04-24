"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
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

function serializeItemDetail(record: DashboardItemDetailRecord): SerializedDashboardItemDetailRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastAccessedAt: record.lastAccessedAt?.toISOString() ?? null,
  };
}
