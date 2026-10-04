/**
 * Sheet descriptions for Excel exports. Kept apart from `xlsx.ts` so tables can describe their
 * export without pulling the zip library into the main bundle (it loads on click).
 */

export type CellValue = string | number | boolean | null | undefined;
export type ColumnType = 'text' | 'integer' | 'decimal' | 'percent' | 'date' | 'link';

export interface SheetColumn<T> {
  header: string;
  value: (row: T) => CellValue;
  /** Defaults to `text`. `date` expects ISO strings; `percent` expects 0–100. */
  type?: ColumnType;
  /** Width in characters; fitted to the content when omitted. */
  width?: number;
}

export interface SheetSpec<T = unknown> {
  /** Tab name (max 31 characters; `[]:*?/\` are removed). */
  name: string;
  /** Large title in the first row. */
  title: string;
  /** Second-row context, e.g. the active filters. */
  subtitle?: string;
  columns: readonly SheetColumn<T>[];
  rows: readonly T[];
}

/** Turns a typed sheet into an untyped one (TypeScript cannot hold a list of differently typed sheets). */
export const sheet = <T>(spec: SheetSpec<T>): SheetSpec => spec as unknown as SheetSpec;

/** "Filtreler: Yaşam döngüsü: Aktif; Ekip: Platform" — the context line of an export. */
export function describeFilters(
  filters: readonly [label: string, value: string | null | undefined][],
): string {
  const active = filters.filter(([, value]) => value);
  return active.length === 0
    ? 'Filtre yok'
    : `Filtreler: ${active.map(([label, value]) => `${label}: ${value}`).join('; ')}`;
}
