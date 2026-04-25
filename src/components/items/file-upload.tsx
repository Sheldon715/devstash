"use client";

import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, LoaderCircle, Upload, X } from "lucide-react";
import Image from "next/image";

import { formatFileSize } from "@/lib/file-size";
import {
  isImageMimeType,
  validateUploadFileMetadata,
  type UploadedFileMetadata,
  type UploadItemType,
} from "@/lib/uploads";
import { deleteTemporaryUpload } from "@/lib/upload-cleanup";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  disabled?: boolean;
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

export function FileUpload({
  disabled = false,
  itemType,
  onChange,
  onError,
  value,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!disabled && !isUploading && !isDeleting) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files.item(0);

    if (file) {
      void uploadFile(file);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0);

    if (file) {
      void uploadFile(file);
    }

    event.target.value = "";
  }

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
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
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
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "We couldn't remove this upload right now.",
      );
    } finally {
      setIsDeleting(false);
    }
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

  const Icon = itemType === "image" ? ImageIcon : FileText;
  const accept = itemType === "image"
    ? ".png,.jpg,.jpeg,.gif,.webp"
    : ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || isUploading || isDeleting}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "min-h-40 rounded-xl border border-dashed border-white/12 bg-white/[0.03] p-4 transition-colors",
          "flex items-center justify-center text-center",
          isDragging ? "border-sky-300/50 bg-sky-300/10" : "",
          disabled || isUploading || isDeleting ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-white/[0.05]",
        )}
        onClick={() => {
          if (!disabled && !isUploading && !isDeleting) {
            inputRef.current?.click();
          }
        }}
      >
        {value ? (
          <div className="w-full space-y-3">
            {previewUrl && isImageMimeType(value.fileMimeType) ? (
              <Image
                src={previewUrl}
                alt=""
                width={480}
                height={280}
                unoptimized
                className="mx-auto max-h-44 rounded-xl border border-white/10 object-contain"
              />
            ) : (
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0e1218]">
                <Icon className="size-6 text-zinc-100" />
              </div>
            )}
            <div>
              <p className="break-all text-sm font-semibold text-zinc-50">{value.fileName}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {value.fileMimeType} · {formatFileSize(value.fileSizeBytes)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              {isUploading ? (
                <LoaderCircle className="size-5 animate-spin text-sky-200" />
              ) : (
                <Upload className="size-5 text-zinc-300" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {isUploading ? "Uploading..." : `Upload ${itemType}`}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {itemType === "image" ? "PNG, JPG, GIF, WebP up to 5 MB" : "PDF, text, data, and config files up to 10 MB"}
              </p>
            </div>
          </div>
        )}
      </div>

      {isUploading ? (
        <progress
          value={progress}
          max={100}
          className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-white/[0.06] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sky-300"
        />
      ) : null}

      {value ? (
        <button
          type="button"
          disabled={disabled || isUploading || isDeleting}
          onClick={() => void clearFile()}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />}
          {isDeleting ? "Removing..." : "Remove file"}
        </button>
      ) : null}
    </div>
  );
}
