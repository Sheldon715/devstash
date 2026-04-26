export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

export interface PaginationState {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function normalizePage(value: string | string[] | number | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 1);

  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.trunc(page));
}

export function getPaginationOffset(page: number, pageSize: number) {
  return (normalizePage(page) - 1) * pageSize;
}

export function getPaginationState(
  totalItems: number,
  page: number,
  pageSize: number,
): PaginationState {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(normalizePage(page), totalPages);

  return {
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    pageSize,
    totalItems,
    totalPages,
  };
}
