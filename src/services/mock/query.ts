import type { PagedResult, SortDirection } from '@/domains/shared/types';
import { NotFoundError } from '@/lib/errors';

export function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

/** Case- and accent-insensitive "contains" across the given fields. */
export function matchesSearch(
  term: string | undefined,
  fields: readonly (string | null | undefined)[],
): boolean {
  const needle = normalise(term ?? '');
  if (!needle) return true;
  return fields.some((field) => field != null && normalise(field).includes(needle));
}

function normalise(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export type SortValue = string | number | null;

/** Stable comparator; `null` values always sort last regardless of direction. */
export function compareValues(a: SortValue, b: SortValue, direction: SortDirection): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const result =
    typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
  return direction === 'asc' ? result : -result;
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): PagedResult<T> {
  const safeSize = Math.max(1, pageSize);
  const lastPage = Math.max(0, Math.ceil(items.length / safeSize) - 1);
  const safePage = Math.min(Math.max(0, page), lastPage);
  const start = safePage * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    pageSize: safeSize,
  };
}

export function findOrThrow<T extends { id: string }>(
  rows: readonly T[],
  id: string,
  entity: string,
): T {
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) throw new NotFoundError(entity, id);
  return row;
}

/** Returns a deep copy so callers can never mutate repository state. */
export function copy<T>(value: T): T {
  return structuredClone(value);
}
