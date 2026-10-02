import { ALLOWED_EXTENSIONS, MAX_ATTACHMENT_BYTES } from '../types';

/** `accept` attribute for the file picker. */
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

export function extensionOf(fileName: string): string {
  const match = /\.([^./\\]+)$/.exec(fileName.trim());
  return match?.[1]?.toLowerCase() ?? '';
}

export const isAllowedFileName = (fileName: string) =>
  (ALLOWED_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));

/** Drops path segments and characters that are unsafe in file names; keeps Turkish letters. */
export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  return (
    base
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f<>:"|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200)
  );
}

/** `1,2 MB`, `640 KB`, `12 B` (Turkish decimal comma). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} ${units[unit]}`;
}

export const MAX_SIZE_LABEL = formatFileSize(MAX_ATTACHMENT_BYTES);

/** Images and PDFs open in a new tab; everything else downloads. */
export const isPreviewable = (contentType: string) =>
  contentType === 'application/pdf' || /^image\/(png|jpe?g|gif|webp)$/.test(contentType);
