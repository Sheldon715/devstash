import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDashboardItemDetail } from "@/lib/db/items";

interface ItemRouteContext {
  params: Promise<{
    id: string;
  }>;
}

function serializeItemDetail(record: NonNullable<Awaited<ReturnType<typeof getDashboardItemDetail>>>) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastAccessedAt: record.lastAccessedAt?.toISOString() ?? null,
  };
}

export async function GET(_request: Request, context: ItemRouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const item = await getDashboardItemDetail(session.user.id, id);

  if (!item) {
    return NextResponse.json(
      {
        success: false,
        error: "Item not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: serializeItemDetail(item),
  });
}
