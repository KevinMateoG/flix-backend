export interface PaginatedResult<T = Record<string, unknown>> {
  page?: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
}

export function normalizePage(page?: number | string, fallback = 1): number {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function normalizeLimit(limit?: number | string, fallback = 10): number {
  const parsed = Number(limit);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
