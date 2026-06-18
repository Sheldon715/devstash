import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDownloadableItemFile } from "@/lib/db/items";
import { getR2Object } from "@/lib/storage/r2";
import { isImageMimeType } from "@/lib/uploads";

export const runtime = "nodejs";

interface UploadContentRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: UploadContentRouteContext) {
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
  const file = await getDownloadableItemFile(session.user.id, id);

  if (!file) {
    return NextResponse.json(
      {
        success: false,
        error: "File not found.",
      },
      { status: 404 },
    );
  }

  const storedObject = await getR2Object(file.fileKey);

  if (!storedObject?.body) {
    return NextResponse.json(
      {
        success: false,
        error: "File not found.",
      },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const isSvg = file.fileMimeType.toLowerCase() === "image/svg+xml";
  const shouldDownload = url.searchParams.get("download") === "1" || isSvg;
  const headers = new Headers({
    "content-disposition": createContentDisposition(file.fileName, shouldDownload),
    "content-type": storedObject.contentType ?? file.fileMimeType,
    "x-content-type-options": "nosniff",
  });

  if (storedObject.contentLength) {
    headers.set("content-length", storedObject.contentLength);
  } else {
    headers.set("content-length", String(file.fileSizeBytes));
  }

  if (!shouldDownload && isImageMimeType(file.fileMimeType)) {
    headers.set("cache-control", "private, max-age=300");
  } else {
    headers.set("cache-control", "no-store");
  }

  return new Response(storedObject.body, {
    headers,
    status: 200,
  });
}

function createContentDisposition(fileName: string, shouldDownload: boolean) {
  const disposition = shouldDownload ? "attachment" : "inline";
  const fallbackName = fileName.replace(/["\\]/g, "");

  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
