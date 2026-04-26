"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  deleteDashboardCollection,
  updateDashboardCollection,
  type DashboardCollectionMetadataRecord,
} from "@/lib/db/collections";

type SerializedDashboardCollectionMetadataRecord = Omit<
  DashboardCollectionMetadataRecord,
  "updatedAt"
> & {
  updatedAt: string;
};

interface UpdateCollectionSuccess {
  success: true;
  data: SerializedDashboardCollectionMetadataRecord;
  error: null;
}

interface UpdateCollectionFailure {
  success: false;
  data: null;
  error: string;
}

export type UpdateCollectionResult = UpdateCollectionSuccess | UpdateCollectionFailure;

interface DeleteCollectionSuccess {
  success: true;
  data: {
    id: string;
  };
  error: null;
}

interface DeleteCollectionFailure {
  success: false;
  data: null;
  error: string;
}

export type DeleteCollectionResult = DeleteCollectionSuccess | DeleteCollectionFailure;

const collectionIdSchema = z.string().trim().min(1, "Collection not found.");

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
    return {
      success: false,
      data: null,
      error: "Collection not found.",
    };
  }

  const parsedData = collectionMetadataSchema.safeParse(data);

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
      error: "You need to be signed in to update collections.",
    };
  }

  try {
    const updatedCollection = await updateDashboardCollection(
      session.user.id,
      parsedCollectionId.data,
      parsedData.data,
    );

    if (!updatedCollection) {
      return {
        success: false,
        data: null,
        error: "Collection not found.",
      };
    }

    return {
      success: true,
      data: serializeCollectionMetadata(updatedCollection),
      error: null,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        data: null,
        error: "A collection with this name already exists.",
      };
    }

    return {
      success: false,
      data: null,
      error: "We couldn't save this collection right now.",
    };
  }
}

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  const parsedCollectionId = collectionIdSchema.safeParse(collectionId);

  if (!parsedCollectionId.success) {
    return {
      success: false,
      data: null,
      error: "Collection not found.",
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      data: null,
      error: "You need to be signed in to delete collections.",
    };
  }

  const deletedCollection = await deleteDashboardCollection(
    session.user.id,
    parsedCollectionId.data,
  );

  if (!deletedCollection) {
    return {
      success: false,
      data: null,
      error: "Collection not found.",
    };
  }

  return {
    success: true,
    data: {
      id: parsedCollectionId.data,
    },
    error: null,
  };
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
