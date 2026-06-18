export const MAX_DASHBOARD_QUERY_LIMIT = 100;

export function normalizeDashboardQueryLimit(limit?: number) {
  if (limit === undefined) {
    return undefined;
  }

  if (!Number.isFinite(limit)) {
    return MAX_DASHBOARD_QUERY_LIMIT;
  }

  return Math.max(1, Math.min(Math.trunc(limit), MAX_DASHBOARD_QUERY_LIMIT));
}
