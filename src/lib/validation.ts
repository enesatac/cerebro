import { z } from 'zod';

/**
 * Zod building blocks for form schemas. Form values stay as plain strings (empty string = no
 * value); mapping to domain types happens in each domain's `schemas/*Form.ts`.
 */

export const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} zorunludur.`)
    .max(max, `${label} en fazla ${max} karakter olabilir.`);

export const optionalText = (label: string, max = 2000) =>
  z.string().trim().max(max, `${label} en fazla ${max} karakter olabilir.`);

/** `bir rol` → `Bir rol`; choice labels are lower-case accusative phrases ("bir rol", "bağımlı uygulamayı"). */
const upperFirst = (value: string) => value.charAt(0).toLocaleUpperCase('tr-TR') + value.slice(1);

/** A required choice from a Select (empty string = nothing chosen). */
export const requiredChoice = (label: string) => z.string().min(1, `${upperFirst(label)} seçin.`);

export const enumChoice = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { message: `${upperFirst(label)} seçin.` });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const optionalDate = z
  .string()
  .refine((value) => value === '' || ISO_DATE.test(value), 'Geçerli bir tarih girin.');
export const requiredDate = (label: string) => z.string().regex(ISO_DATE, `${label} zorunludur.`);

export const optionalWholeNumber = (
  label: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {},
) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), `${label} tam sayı olmalıdır.`)
    .refine(
      (value) => value === '' || (Number(value) >= min && Number(value) <= max),
      `${label} ${min} ile ${max} arasında olmalıdır.`,
    );

/** Only http(s) links are stored — never `javascript:`, `data:` or other schemes. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export const requiredUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} zorunludur.`)
    .refine(isHttpUrl, 'Tam bir http(s) adresi girin, ör. https://…');

export const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isHttpUrl(value),
    'Tam bir http(s) adresi girin, ör. https://…',
  );

export const email = (label: string) =>
  z.string().trim().min(1, `${label} zorunludur.`).email('Geçerli bir e-posta adresi girin.');
export const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || z.email().safeParse(value).success,
    'Geçerli bir e-posta adresi girin.',
  );

/**
 * Cerebro must never hold credentials. Rejects text that looks like a password, token, key or a
 * connection string with embedded credentials.
 */
const SECRET_PATTERNS = [
  /\bpass(word|wd)?\s*[:=]/i,
  /\b(api[_-]?key|secret|token|client[_-]?secret)\s*[:=]/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i,
];

export function looksLikeSecret(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export const NO_SECRETS_MESSAGE =
  "Bu bir kimlik bilgisine benziyor. Cerebro asla şifre, token veya anahtar saklamamalı — bunun yerine secrets manager'a referans verin.";

/** Free text that must not contain credentials (notes, descriptions next to URLs). */
export const secretFreeText = (label: string, max = 2000) =>
  optionalText(label, max).refine((value) => !looksLikeSecret(value), NO_SECRETS_MESSAGE);

/** `''` → `null`, otherwise the trimmed string. */
export const emptyToNull = (value: string): string | null =>
  value.trim() === '' ? null : value.trim();
export const toNumberOrNull = (value: string): number | null =>
  value.trim() === '' ? null : Number(value);

/** Short random id for rows added in forms (environments, milestones…). */
export function newRowId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}
