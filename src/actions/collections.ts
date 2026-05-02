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
import {
  deleteDashboardCollection,
  toggleDashboardCollectionFavorite,
  updateDashboardCollection,
  type DashboardCollectionMetadataRecord,
} from "@/lib/db/collections";

type SerializedDashboardCollectionMetadataRecord = Omit<
  DashboardCollectionMetadataRecord,
  "updatedAt"
> & {
  updatedAt: string;
};
const collectionIdSchema = nonEmptyIdSchema("Collection not found.");

export type UpdateCollectionResult = ActionResult<SerializedDashboardCollectionMetadataRecord>;
export type ToggleCollectionFavoriteResult = UpdateCollectionResult;
export type DeleteCollectionResult = ActionResult<{ id: string }>;

const collectionMetadataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Collection name is required.")
    .max(80, "Collection name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(280, "Description must be 280 characters or fewer.")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
});

export async function updateCollection(
  collectionId: string,
  data: unknown,
): Promise<UpdateCollectionResult> {
  const parsedCollectionId = collectionIdSchema.safeParse(collectionId);

  if (!parsedCollectionId.success) {
    return actionFailure("Collection not found.");
  }

  const parsedData = collectionMetadataSchema.safeParse(data);

  if (!parsedData.success) {
    return actionFailure(getZodErrorMessage(parsedData.error));
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure("You need to be signed in to update collections.");
  }

  try {
    const updatedCollection = await updateDashboardCollection(
      userId,
      parsedCollectionId.data,
      parsedData.data,
    );

    if (!updatedCollection) {
      return actionFailure("Collection not found.");
    }

    return actionSuccess(serializeCollectionMetadata(updatedCollection));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionFailure("A collection with this name already exists.");
    }

    return actionFailure("We couldn't save this collection right now.");
  }
}

export async function toggleCollectionFavorite(
  collectionId: string,
): Promise<ToggleCollectionFavoriteResult> {
  return runOwnedMutation({
    id: collectionId,
    idSchema: collectionIdSchema,
    unauthorizedError: "You need to be signed in to update collections.",
    notFoundError: "Collection not found.",
    mutate: toggleDashboardCollectionFavorite,
    serialize: (record) => serializeCollectionMetadata(record),
  });
}

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  return runOwnedMutation({
    id: collectionId,
    idSchema: collectionIdSchema,
    unauthorizedError: "You need to be signed in to delete collections.",
    notFoundError: "Collection not found.",
    mutate: deleteDashboardCollection,
    serialize: (_record, normalizedCollectionId) => ({
      id: normalizedCollectionId,
    }),
  });
}

function serializeCollectionMetadata(
  collection: DashboardCollectionMetadataRecord,
): SerializedDashboardCollectionMetadataRecord {
  return {
    ...collection,
    updatedAt: collection.updatedAt.toISOString(),
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "code") === "P2002"
  );
}
