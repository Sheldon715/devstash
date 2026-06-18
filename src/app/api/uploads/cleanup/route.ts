import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isItemFileKeyInUse } from "@/lib/db/items";
import { deleteR2Object } from "@/lib/storage/r2";
import { isUploadKeyOwnedByUser } from "@/lib/uploads";

export const runtime = "nodejs";

interface CleanupUploadRequestBody {
  fileKey?: unknown;
}

interface CleanupUploadResponseBody {
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<CleanupUploadResponseBody>(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let body: CleanupUploadRequestBody;

  try {
    body = (await request.json()) as CleanupUploadRequestBody;
  } catch {
    return NextResponse.json<CleanupUploadResponseBody>(
      {
        success: false,
        error: "Upload not found.",
      },
      { status: 400 },
    );
  }

  const fileKey = typeof body.fileKey === "string" ? body.fileKey.trim() : "";

  if (!fileKey || !isUploadKeyOwnedByUser(fileKey, session.user.id)) {
    return NextResponse.json<CleanupUploadResponseBody>(
      {
        success: false,
        error: "Upload not found.",
      },
      { status: 404 },
    );
  }

  if (await isItemFileKeyInUse(session.user.id, fileKey)) {
    return NextResponse.json<CleanupUploadResponseBody>({
      success: true,
    });
  }

  try {
    await deleteR2Object(fileKey);

    return NextResponse.json<CleanupUploadResponseBody>({
      success: true,
    });
  } catch {
    return NextResponse.json<CleanupUploadResponseBody>(
      {
        success: false,
        error: "We couldn't remove this upload right now.",
      },
      { status: 500 },
    );
  }
}
