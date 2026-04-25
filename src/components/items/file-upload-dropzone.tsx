"use client";

import type { ChangeEvent, DragEvent, RefObject } from "react";
import { FileText, ImageIcon, LoaderCircle, Upload } from "lucide-react";
import Image from "next/image";

import { formatFileSize } from "@/lib/file-size";
import { isImageMimeType, type UploadedFileMetadata, type UploadItemType } from "@/lib/uploads";
import { cn } from "@/lib/utils";

interface FileUploadDropzoneProps {
  accept: string;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isDeleting: boolean;
  isDragging: boolean;
  isUploading: boolean;
  itemType: UploadItemType;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  value: UploadedFileMetadata | null;
}

export function FileUploadDropzone({
  accept,
  disabled,
  inputRef,
  isDeleting,
  isDragging,
  isUploading,
  itemType,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  previewUrl,
  value,
}: FileUploadDropzoneProps) {
  const Icon = itemType === "image" ? ImageIcon : FileText;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || isUploading || isDeleting}
        onChange={onFileChange}
        className="hidden"
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "min-h-40 rounded-xl border border-dashed border-white/12 bg-white/[0.03] p-4 transition-colors",
          "flex items-center justify-center text-center",
          isDragging ? "border-sky-300/50 bg-sky-300/10" : "",
          disabled || isUploading || isDeleting
            ? "cursor-not-allowed opacity-70"
            : "cursor-pointer hover:bg-white/[0.05]",
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
                {value.fileMimeType} - {formatFileSize(value.fileSizeBytes)}
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
                {itemType === "image"
                  ? "PNG, JPG, GIF, WebP up to 5 MB"
                  : "PDF, text, data, and config files up to 10 MB"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
