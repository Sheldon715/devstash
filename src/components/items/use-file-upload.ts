"use client";

import { useEffect, useState } from "react";

import { deleteTemporaryUpload } from "@/lib/upload-cleanup";
import {
  validateUploadFileMetadata,
  type UploadedFileMetadata,
  type UploadItemType,
} from "@/lib/uploads";

interface UseFileUploadInput {
  disabled: boolean;
  itemType: UploadItemType;
  onChange: (file: UploadedFileMetadata | null) => void;
  onError: (message: string) => void;
  value: UploadedFileMetadata | null;
}

interface UploadResponseBody {
  success: boolean;
  data?: UploadedFileMetadata;
  error?: string;
}

export function useFileUpload({
  disabled,
  itemType,
  onChange,
  onError,
  value,
}: UseFileUploadInput) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function uploadFile(file: File) {
    if (disabled || isUploading || isDeleting) {
      return;
    }

    const validation = validateUploadFileMetadata({
      fileName: file.name,
      itemType,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    if (validation.error) {
      onError(validation.error);
      return;
    }

    const localPreviewUrl = itemType === "image" ? URL.createObjectURL(file) : null;

    setIsUploading(true);
    setProgress(0);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return localPreviewUrl;
    });

    try {
      const previousFile = value;
      const uploadedFile = await postUpload(file);

      onChange(uploadedFile);
      if (previousFile && previousFile.fileKey !== uploadedFile.fileKey) {
        deleteTemporaryUpload(previousFile.fileKey).catch(() => {
          onError("The previous upload could not be removed from storage.");
        });
      }
      setProgress(100);
    } catch (error) {
      onChange(null);
      onError(
        error instanceof Error ? error.message : "We couldn't upload this file right now.",
      );
      clearPreviewUrl();
    } finally {
      setIsUploading(false);
    }
  }

  async function clearFile() {
    if (disabled || isUploading || isDeleting || !value) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteTemporaryUpload(value.fileKey);
      onChange(null);
      setProgress(0);
      clearPreviewUrl();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "We couldn't remove this upload right now.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function clearPreviewUrl() {
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
  }

  function postUpload(file: File) {
    return new Promise<UploadedFileMetadata>((resolve, reject) => {
      const request = new XMLHttpRequest();
      const formData = new FormData();

      formData.set("file", file);
      formData.set("type", itemType);

      request.open("POST", "/api/uploads");
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
        }
      };
      request.onerror = () => reject(new Error("We couldn't upload this file right now."));
      request.onload = () => {
        let body: UploadResponseBody | null = null;

        try {
          body = JSON.parse(request.responseText) as UploadResponseBody;
        } catch {}

        if (request.status >= 200 && request.status < 300 && body?.success && body.data) {
          resolve(body.data);
          return;
        }

        reject(new Error(body?.error ?? "We couldn't upload this file right now."));
      };
      request.send(formData);
    });
  }

  return {
    clearFile,
    isDeleting,
    isUploading,
    previewUrl,
    progress,
    uploadFile,
  };
}
