"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import { FileUploadDropzone } from "@/components/items/file-upload-dropzone";
import { useFileUpload } from "@/components/items/use-file-upload";
import type { UploadedFileMetadata, UploadItemType } from "@/lib/uploads";

interface FileUploadProps {
  disabled?: boolean;
  itemType: UploadItemType;
  onChange: (file: UploadedFileMetadata | null) => void;
  onError: (message: string) => void;
  value: UploadedFileMetadata | null;
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
  const {
    clearFile,
    isDeleting,
    isUploading,
    previewUrl,
    progress,
    uploadFile,
  } = useFileUpload({
    disabled,
    itemType,
    onChange,
    onError,
    value,
  });
  const accept = itemType === "image"
    ? ".png,.jpg,.jpeg,.gif,.webp"
    : ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini";

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

  return (
    <div className="space-y-3">
      <FileUploadDropzone
        accept={accept}
        disabled={disabled}
        inputRef={inputRef}
        isDeleting={isDeleting}
        isDragging={isDragging}
        isUploading={isUploading}
        itemType={itemType}
        previewUrl={previewUrl}
        value={value}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
      />

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
