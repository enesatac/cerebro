export type CsvValue = string | number | boolean | null | undefined;

/** RFC 4180 escaping; also neutralises spreadsheet formula injection (=, +, -, @). */
function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(
  rows: readonly T[],
  columns: readonly { header: string; value: (row: T) => CsvValue }[],
): string {
  const lines = [
    columns.map((column) => escapeCell(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(',')),
  ];
  return lines.join('\r\n');
}

/** Triggers a browser download of `content` as a UTF-8 CSV (with BOM so Excel detects UTF-8). */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
