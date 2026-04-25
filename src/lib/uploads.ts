export type UploadItemType = "file" | "image";

export interface UploadedFileMetadata {
  fileKey: string;
  fileUrl: string | null;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
}

export interface UploadValidationInput {
  fileName: string;
  itemType: UploadItemType;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadValidationResult {
  error: string | null;
}

const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"] as const;
const FILE_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".toml",
  ".ini",
] as const;

const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

const FILE_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
] as const;

export function validateUploadFileMetadata({
  fileName,
  itemType,
  mimeType,
  sizeBytes,
}: UploadValidationInput): UploadValidationResult {
  const normalizedMimeType = mimeType.toLowerCase();
  const extension = getFileExtension(fileName);
  const allowedExtensions = itemType === "image" ? IMAGE_EXTENSIONS : FILE_EXTENSIONS;
  const allowedMimeTypes = itemType === "image" ? IMAGE_MIME_TYPES : FILE_MIME_TYPES;
  const maxSizeBytes = itemType === "image" ? IMAGE_MAX_SIZE_BYTES : FILE_MAX_SIZE_BYTES;
  const itemLabel = itemType === "image" ? "Images" : "Files";
  const maxSizeLabel = itemType === "image" ? "5 MB" : "10 MB";

  if (!fileName.trim()) {
    return {
      error: "Choose a file to upload.",
    };
  }

  if (sizeBytes <= 0) {
    return {
      error: "The selected file is empty.",
    };
  }

  if (sizeBytes > maxSizeBytes) {
    return {
      error: `${itemLabel} must be ${maxSizeLabel} or smaller.`,
    };
  }

  if (!allowedExtensions.includes(extension as never)) {
    return {
      error: `${itemLabel} must use one of these extensions: ${allowedExtensions.join(", ")}.`,
    };
  }

  if (!allowedMimeTypes.includes(normalizedMimeType as never)) {
    return {
      error: `${itemLabel} must use an allowed MIME type.`,
    };
  }

  return {
    error: null,
  };
}

export function createUploadObjectKey(userId: string, itemType: UploadItemType, fileName: string) {
  const safeFileName = sanitizeUploadFileName(fileName);

  return `users/${userId}/${itemType}/${createUploadId()}-${safeFileName}`;
}

export function isImageMimeType(mimeType: string | null) {
  return Boolean(mimeType && IMAGE_MIME_TYPES.includes(mimeType.toLowerCase() as never));
}

export function isUploadKeyOwnedByUser(fileKey: string, userId: string) {
  return fileKey.startsWith(`users/${userId}/`);
}

export function isUploadKeyForItemType(fileKey: string, userId: string, itemType: UploadItemType) {
  return fileKey.startsWith(`users/${userId}/${itemType}/`);
}

function sanitizeUploadFileName(fileName: string) {
  const normalizedFileName = fileName.trim().replace(/\\/g, "/").split("/").pop() ?? "upload";
  const safeFileName = normalizedFileName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeFileName || "upload";
}

function getFileExtension(fileName: string) {
  const trimmedName = fileName.trim().toLowerCase();
  const extensionStart = trimmedName.lastIndexOf(".");

  if (extensionStart === -1) {
    return "";
  }

  return trimmedName.slice(extensionStart);
}

function createUploadId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
