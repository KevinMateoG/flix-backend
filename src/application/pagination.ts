import { AppError } from "./errors/app.error.ts";

export interface PaginatedResult<T = Record<string, unknown>> {
  page?: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
}

export interface StandardPaginationMeta {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

export interface StandardPaginatedResponse<T> {
  data: T[];
  pagination: StandardPaginationMeta;
}

export function normalizePage(page?: number | string, fallback = 1): number {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function normalizeLimit(limit?: number | string, fallback = 10): number {
  const parsed = Number(limit);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function parseStrictPositiveIntParam(
  value: unknown,
  fieldName: string,
  defaultValue: number,
): number {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw AppError.badRequest(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

export function buildPaginatedResponse<T>(
  allItems: T[],
  currentPage: number,
  limit: number,
): StandardPaginatedResponse<T> {
  const total = allItems.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const offset = (currentPage - 1) * limit;
  const data = allItems.slice(offset, offset + limit);

  return {
    data,
    pagination: {
      total,
      currentPage,
      limit,
      totalPages,
    },
  };
}