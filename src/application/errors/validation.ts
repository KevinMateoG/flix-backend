import { AppError } from "./app.error.ts";
import { type MediaType } from "../../domain/models/library-item.ts";

export function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw AppError.badRequest(`${field} is required and must be a string`);
  }
  return value.trim();
}

export function requirePositiveInteger(value: unknown, field: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw AppError.badRequest(`${field} must be a number`);
  }
  return value;
}

export function requireNonNegativeInteger(
  value: unknown,
  field: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw AppError.badRequest(`${field} must be a number`);
  }
  return value;
}

export function requireMediaType(value: unknown): MediaType {
  if (value !== "movie" && value !== "tv") {
    throw AppError.badRequest("mediaType must be movie or tv");
  }
  return value;
}

export function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw AppError.badRequest(`${field} must be a number`);
  }
  return value;
}
