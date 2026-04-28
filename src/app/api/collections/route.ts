import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getUserBillingUsage } from "@/lib/billing/usage";
import { canCreateCollection } from "@/lib/billing/usage-limits";
import {
  createDashboardCollection,
  type DashboardCollectionCardRecord,
} from "@/lib/db/collections";

interface CollectionResponseBody {
  success: boolean;
  data?: SerializedDashboardCollectionCardRecord;
  error?: string;
}

type SerializedDashboardCollectionCardRecord = Omit<
  DashboardCollectionCardRecord,
  "lastUpdatedAt"
> & {
  lastUpdatedAt: string | null;
};

const createCollectionSchema = z.object({
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

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<CollectionResponseBody>(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<CollectionResponseBody>(
      {
        success: false,
        error: "Send valid collection details.",
      },
      { status: 400 },
    );
  }

  const parsedData = createCollectionSchema.safeParse(body);

  if (!parsedData.success) {
    return NextResponse.json<CollectionResponseBody>(
      {
        success: false,
        error: parsedData.error.issues.map((issue) => issue.message).join(" "),
      },
      { status: 400 },
    );
  }

  try {
    const usage = await getUserBillingUsage(session.user.id);
    const limit = canCreateCollection(usage.plan, usage.totalCollections);

    if (!limit.allowed) {
      return NextResponse.json<CollectionResponseBody>(
        {
          success: false,
          error: limit.message ?? "Upgrade to Pro to create more collections.",
        },
        { status: 403 },
      );
    }

    const collection = await createDashboardCollection(session.user.id, parsedData.data);

    return NextResponse.json<CollectionResponseBody>({
      success: true,
      data: serializeCollection(collection),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json<CollectionResponseBody>(
        {
          success: false,
          error: "A collection with this name already exists.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json<CollectionResponseBody>(
      {
        success: false,
        error: "We couldn't create this collection right now.",
      },
      { status: 500 },
    );
  }
}

function serializeCollection(
  collection: DashboardCollectionCardRecord,
): SerializedDashboardCollectionCardRecord {
  return {
    ...collection,
    lastUpdatedAt: collection.lastUpdatedAt?.toISOString() ?? null,
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "code") === "P2002"
  );
}
