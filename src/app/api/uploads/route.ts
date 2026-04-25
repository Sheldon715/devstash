import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isItemFileKeyInUse } from "@/lib/db/items";
import {
  createUploadObjectKey,
  isUploadKeyOwnedByUser,
  validateUploadFileMetadata,
  type UploadItemType,
} from "@/lib/uploads";
import { deleteR2Object, uploadR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

interface UploadResponseBody {
  success: boolean;
  data?: {
    fileKey: string;
    fileUrl: string | null;
    fileName: string;
    fileMimeType: string;
    fileSizeBytes: number;
  };
  error?: string;
}

interface DeleteUploadRequestBody {
  fileKey?: unknown;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "Upload a valid file.",
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const itemType = formData.get("type");

  if (!(file instanceof File) || !isUploadItemType(itemType)) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "Upload a valid file.",
      },
      { status: 400 },
    );
  }

  const validation = validateUploadFileMetadata({
    fileName: file.name,
    itemType,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (validation.error) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: validation.error,
      },
      { status: 400 },
    );
  }

  const fileKey = createUploadObjectKey(session.user.id, itemType, file.name);
  const body = Buffer.from(await file.arrayBuffer());

  try {
    const fileUrl = await uploadR2Object({
      body,
      contentType: file.type,
      key: fileKey,
    });

    return NextResponse.json<UploadResponseBody>({
      success: true,
      data: {
        fileKey,
        fileUrl,
        fileName: file.name,
        fileMimeType: file.type,
        fileSizeBytes: file.size,
      },
    });
  } catch (error) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "We couldn't upload this file right now.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let body: DeleteUploadRequestBody;

  try {
    body = (await request.json()) as DeleteUploadRequestBody;
  } catch {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "Upload not found.",
      },
      { status: 400 },
    );
  }

  const fileKey = typeof body.fileKey === "string" ? body.fileKey.trim() : "";

  if (!fileKey || !isUploadKeyOwnedByUser(fileKey, session.user.id)) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "Upload not found.",
      },
      { status: 404 },
    );
  }

  if (await isItemFileKeyInUse(session.user.id, fileKey)) {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "This file is already attached to an item.",
      },
      { status: 409 },
    );
  }

  try {
    await deleteR2Object(fileKey);

    return NextResponse.json<UploadResponseBody>({
      success: true,
    });
  } catch {
    return NextResponse.json<UploadResponseBody>(
      {
        success: false,
        error: "We couldn't remove this upload right now.",
      },
      { status: 500 },
    );
  }
}

function isUploadItemType(value: FormDataEntryValue | null): value is UploadItemType {
  return value === "file" || value === "image";
}
