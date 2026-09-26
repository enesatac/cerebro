const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('en-GB');

/** `4.8M`, `28K` — for approximate magnitudes such as user counts. */
export function formatCompactNumber(value: number | null | undefined, fallback = '—'): string {
  return value == null ? fallback : compactNumber.format(value);
}

export function formatInteger(value: number | null | undefined, fallback = '—'): string {
  return value == null ? fallback : integer.format(value);
}

/** `"application"`, 3 → `"3 applications"`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** `€1.8M` style amounts; full precision is rarely useful at portfolio level. */
export function formatCurrency(
  value: number | null | undefined,
  currency: string,
  fallback = '—',
): string {
  if (value == null) return fallback;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}
