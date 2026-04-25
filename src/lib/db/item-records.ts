import type { UploadedFileMetadata } from "@/lib/uploads";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

export interface DashboardItemRecord {
  id: string;
  title: string;
  description: string;
  typeKey: DashboardItemTypeKey;
  typeLabel: string;
  collectionNames: string[];
  tags: string[];
  fileName: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardItemStats {
  totalItems: number;
  favoriteItems: number;
}

export interface DashboardItemDetailTagRecord {
  color: string | null;
  name: string;
}

export interface DashboardItemDetailRecord {
  id: string;
  title: string;
  description: string;
  contentMode: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  language: string | null;
  aiSummary: string | null;
  collectionNames: string[];
  tags: DashboardItemDetailTagRecord[];
  isPinned: boolean;
  isFavorite: boolean;
  typeKey: DashboardItemTypeKey;
  typeLabel: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
}

export interface DashboardSidebarItemTypeRecord {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  totalItems: number;
  typeKey: DashboardItemTypeKey;
}

export interface DashboardItemTypePageRecord {
  key: string;
  name: string;
  icon: string | null;
  totalItems: number;
  typeKey: DashboardItemTypeKey;
}

export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

export type CreatableItemTypeKey = DashboardItemTypeKey;

export interface CreateItemData {
  typeKey: CreatableItemTypeKey;
  title: string;
  description: string | null;
  content: string | null;
  file: UploadedFileMetadata | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

export interface DownloadableItemFileRecord {
  fileKey: string;
  fileMimeType: string;
  fileName: string;
  fileSizeBytes: number;
  typeKey: DashboardItemTypeKey;
}
