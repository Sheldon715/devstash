import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getDownloadableItemFileMock, getR2ObjectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getDownloadableItemFileMock: vi.fn(),
  getR2ObjectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  getDownloadableItemFile: getDownloadableItemFileMock,
}));

vi.mock("@/lib/storage/r2", () => ({
  getR2Object: getR2ObjectMock,
}));

import { GET } from "@/app/api/uploads/[id]/route";

describe("GET /api/uploads/[id]", () => {
  beforeEach(() => {
    authMock.mockReset();
    getDownloadableItemFileMock.mockReset();
    getR2ObjectMock.mockReset();

    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getR2ObjectMock.mockResolvedValue({
      body: createBodyStream(),
      contentLength: "4",
      contentType: null,
    });
  });

  it("serves regular images inline with nosniff and private caching", async () => {
    getDownloadableItemFileMock.mockResolvedValue({
      fileKey: "users/user-1/image/photo.png",
      fileMimeType: "image/png",
      fileName: "photo.png",
      fileSizeBytes: 4,
      typeKey: "image",
    });

    const response = await GET(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("inline");
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
  });

  it("forces SVG content to download even without a download query", async () => {
    getDownloadableItemFileMock.mockResolvedValue({
      fileKey: "users/user-1/image/vector.svg",
      fileMimeType: "image/svg+xml",
      fileName: "vector.svg",
      fileSizeBytes: 4,
      typeKey: "image",
    });

    const response = await GET(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("uses no-store for non-image downloads", async () => {
    getDownloadableItemFileMock.mockResolvedValue({
      fileKey: "users/user-1/file/config.json",
      fileMimeType: "application/json",
      fileName: "config.json",
      fileSizeBytes: 4,
      typeKey: "file",
    });

    const response = await GET(createRequest("?download=1"), createContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

function createRequest(search = "") {
  return new Request(`http://localhost:3000/api/uploads/item-1${search}`);
}

function createContext() {
  return {
    params: Promise.resolve({
      id: "item-1",
    }),
  };
}

function createBodyStream() {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("file"));
      controller.close();
    },
  });
}
