export type DashboardItemTypeKey =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "file"
  | "image"
  | "link";

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
}

export interface DashboardItemType {
  id: string;
  key: DashboardItemTypeKey;
  name: string;
  icon: string;
  totalItems: number;
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemIds: string[];
}

export interface DashboardItem {
  id: string;
  title: string;
  description: string;
  typeKey: DashboardItemTypeKey;
  collectionIds: string[];
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string;
}

export const dashboardMockData = {
  user: {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    plan: "pro",
  } satisfies DashboardUser,

  itemTypes: [
    { id: "type-1", key: "snippet", name: "Snippets", icon: "code", totalItems: 24 },
    { id: "type-2", key: "prompt", name: "Prompts", icon: "sparkles", totalItems: 18 },
    { id: "type-3", key: "command", name: "Commands", icon: "terminal", totalItems: 15 },
    { id: "type-4", key: "note", name: "Notes", icon: "file-text", totalItems: 12 },
    { id: "type-5", key: "file", name: "Files", icon: "paperclip", totalItems: 5 },
    { id: "type-6", key: "image", name: "Images", icon: "image", totalItems: 3 },
    { id: "type-7", key: "link", name: "Links", icon: "link", totalItems: 8 },
  ] satisfies DashboardItemType[],

  collections: [
    {
      id: "col-1",
      name: "React Patterns",
      description: "Common React patterns and hooks",
      isFavorite: true,
      itemIds: ["item-1", "item-2", "item-6"],
    },
    {
      id: "col-2",
      name: "Python Snippets",
      description: "Useful Python code snippets",
      isFavorite: false,
      itemIds: ["item-7", "item-8"],
    },
    {
      id: "col-3",
      name: "Context Files",
      description: "AI context files for projects",
      isFavorite: true,
      itemIds: ["item-5", "item-9"],
    },
    {
      id: "col-4",
      name: "Interview Prep",
      description: "Technical interview preparation",
      isFavorite: false,
      itemIds: ["item-3", "item-10", "item-11"],
    },
    {
      id: "col-5",
      name: "Git Commands",
      description: "Frequently used git commands",
      isFavorite: true,
      itemIds: ["item-4", "item-12"],
    },
    {
      id: "col-6",
      name: "AI Prompts",
      description: "Curated AI prompts for coding",
      isFavorite: false,
      itemIds: ["item-6", "item-13"],
    },
  ] satisfies DashboardCollection[],

  items: [
    {
      id: "item-1",
      title: "useAuth Hook",
      description: "Custom authentication hook for React applications",
      typeKey: "snippet",
      collectionIds: ["col-1"],
      tags: ["react", "auth", "hooks"],
      isPinned: true,
      isFavorite: true,
      updatedAt: "2026-01-15",
    },
    {
      id: "item-2",
      title: "API Error Handling Pattern",
      description: "Retry wrapper with exponential backoff and typed errors",
      typeKey: "snippet",
      collectionIds: ["col-1"],
      tags: ["api", "typescript"],
      isPinned: true,
      isFavorite: false,
      updatedAt: "2026-01-12",
    },
    {
      id: "item-3",
      title: "Behavioral Interview Notes",
      description: "STAR stories and common follow-up frameworks",
      typeKey: "note",
      collectionIds: ["col-4"],
      tags: ["interview", "career"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-10",
    },
    {
      id: "item-4",
      title: "Interactive Rebase Cheatsheet",
      description: "Quick commands for squash, reword, and split commits",
      typeKey: "command",
      collectionIds: ["col-5"],
      tags: ["git", "cli"],
      isPinned: false,
      isFavorite: true,
      updatedAt: "2026-01-08",
    },
    {
      id: "item-5",
      title: "Project Kickoff Context",
      description: "Reusable context template for new coding sessions",
      typeKey: "file",
      collectionIds: ["col-3"],
      tags: ["context", "docs"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-07",
    },
    {
      id: "item-6",
      title: "Code Review Prompt",
      description: "Prompt template for structured PR reviews",
      typeKey: "prompt",
      collectionIds: ["col-1", "col-6"],
      tags: ["ai", "review"],
      isPinned: false,
      isFavorite: true,
      updatedAt: "2026-01-06",
    },
    {
      id: "item-7",
      title: "CSV Cleaner Script",
      description: "Small Python script to normalize CSV columns",
      typeKey: "snippet",
      collectionIds: ["col-2"],
      tags: ["python", "data"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-05",
    },
    {
      id: "item-8",
      title: "FastAPI Starter Route",
      description: "Base route setup with validation and error responses",
      typeKey: "snippet",
      collectionIds: ["col-2"],
      tags: ["python", "api"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-04",
    },
    {
      id: "item-9",
      title: "Architecture Diagram",
      description: "Initial system diagram for dashboard and data flows",
      typeKey: "image",
      collectionIds: ["col-3"],
      tags: ["diagram", "architecture"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-03",
    },
    {
      id: "item-10",
      title: "Top LeetCode Patterns",
      description: "Pattern list and warm-up plan for interviews",
      typeKey: "note",
      collectionIds: ["col-4"],
      tags: ["algorithms", "interview"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-02",
    },
    {
      id: "item-11",
      title: "System Design Checklist",
      description: "A concise checklist for interview system design rounds",
      typeKey: "note",
      collectionIds: ["col-4"],
      tags: ["system-design", "interview"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2026-01-01",
    },
    {
      id: "item-12",
      title: "Undo Last Commit",
      description: "Reference commands for safe local commit rollback",
      typeKey: "command",
      collectionIds: ["col-5"],
      tags: ["git", "workflow"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2025-12-31",
    },
    {
      id: "item-13",
      title: "Bug Reproduction Prompt",
      description: "Prompt template for reproducing bugs with clear steps",
      typeKey: "prompt",
      collectionIds: ["col-6"],
      tags: ["ai", "debugging"],
      isPinned: false,
      isFavorite: false,
      updatedAt: "2025-12-30",
    },
  ] satisfies DashboardItem[],
} as const;
