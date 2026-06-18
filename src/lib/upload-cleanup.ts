interface DeleteUploadResponseBody {
  success: boolean;
  error?: string;
}

export async function deleteTemporaryUpload(fileKey: string) {
  const response = await fetch("/api/uploads", {
    body: JSON.stringify({ fileKey }),
    headers: {
      "content-type": "application/json",
    },
    method: "DELETE",
  });
  const body = (await response.json().catch(() => null)) as DeleteUploadResponseBody | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.error ?? "We couldn't remove this upload right now.");
  }
}

export function queueTemporaryUploadCleanup(fileKey: string) {
  const body = JSON.stringify({ fileKey });

  if (navigator.sendBeacon) {
    const payload = new Blob([body], {
      type: "application/json",
    });

    if (navigator.sendBeacon("/api/uploads/cleanup", payload)) {
      return;
    }
  }

  fetch("/api/uploads/cleanup", {
    body,
    headers: {
      "content-type": "application/json",
    },
    keepalive: true,
    method: "POST",
  }).catch(() => {});
}
