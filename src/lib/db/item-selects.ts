export const dashboardItemDetailSelect = {
  id: true,
  title: true,
  description: true,
  contentMode: true,
  content: true,
  url: true,
  fileName: true,
  fileUrl: true,
  fileMimeType: true,
  fileSizeBytes: true,
  language: true,
  aiSummary: true,
  isPinned: true,
  isFavorite: true,
  createdAt: true,
  updatedAt: true,
  lastAccessedAt: true,
  type: {
    select: {
      key: true,
      name: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          color: true,
          name: true,
        },
      },
    },
  },
  collections: {
    select: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} as const;
