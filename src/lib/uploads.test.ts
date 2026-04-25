import { describe, expect, it } from "vitest";

import { isUploadKeyOwnedByUser, validateUploadFileMetadata } from "@/lib/uploads";

describe("upload validation", () => {
  it("accepts supported image uploads within the size limit", () => {
    expect(
      validateUploadFileMetadata({
        fileName: "diagram.webp",
        itemType: "image",
        mimeType: "image/webp",
        sizeBytes: 2 * 1024 * 1024,
      }),
    ).toEqual({
      error: null,
    });
  });

  it("rejects images over 5 MB", () => {
    expect(
      validateUploadFileMetadata({
        fileName: "large.png",
        itemType: "image",
        mimeType: "image/png",
        sizeBytes: 6 * 1024 * 1024,
      }),
    ).toEqual({
      error: "Images must be 5 MB or smaller.",
    });
  });

  it("rejects unsupported file extensions", () => {
    expect(
      validateUploadFileMetadata({
        fileName: "archive.zip",
        itemType: "file",
        mimeType: "application/zip",
        sizeBytes: 1024,
      }).error,
    ).toContain("Files must use one of these extensions");
  });

  it("checks whether an uploaded object key belongs to a user", () => {
    expect(isUploadKeyOwnedByUser("users/user-1/file/upload.json", "user-1")).toBe(true);
    expect(isUploadKeyOwnedByUser("users/user-2/file/upload.json", "user-1")).toBe(false);
  });
});
