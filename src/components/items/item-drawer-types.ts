import type { DashboardItemDetailRecord } from "@/lib/db/items";

export type SerializedDashboardItemDetailRecord = Omit<
  DashboardItemDetailRecord,
  "createdAt" | "lastAccessedAt" | "updatedAt"
> & {
  createdAt: string;
  lastAccessedAt: string | null;
  updatedAt: string;
};

export interface EditItemFormState {
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
}

export interface ItemDrawerToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}
