/** Helpers for parsing untrusted URL search params into typed UI state. */

/** `value` if it is one of `allowed`, otherwise `null`. */
export function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** A non-negative integer, or `null` for anything else. */
export function nonNegativeInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  return Number(value);
}

/** Reads a 1-based `page` param as a zero-based index. */
export function parsePageIndex(value: string | null): number {
  const page = nonNegativeInt(value);
  return page && page > 0 ? page - 1 : 0;
}

/** Reads a page size, falling back when it is not one of the allowed options. */
export function parsePageSize(
  value: string | null,
  allowed: readonly number[],
  fallback: number,
): number {
  const size = nonNegativeInt(value);
  return size !== null && allowed.includes(size) ? size : fallback;
}
