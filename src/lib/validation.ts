import { z } from 'zod';

/**
 * Zod building blocks for form schemas. Form values stay as plain strings (empty string = no
 * value); mapping to domain types happens in each domain's `schemas/*Form.ts`.
 */

export const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

export const optionalText = (label: string, max = 2000) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

/** A required choice from a Select (empty string = nothing chosen). */
export const requiredChoice = (label: string) => z.string().min(1, `Select ${label}.`);

export const enumChoice = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { message: `Select ${label}.` });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const optionalDate = z
  .string()
  .refine((value) => value === '' || ISO_DATE.test(value), 'Enter a valid date.');
export const requiredDate = (label: string) => z.string().regex(ISO_DATE, `${label} is required.`);

export const optionalWholeNumber = (
  label: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {},
) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), `${label} must be a whole number.`)
    .refine(
      (value) => value === '' || (Number(value) >= min && Number(value) <= max),
      `${label} must be between ${min} and ${max}.`,
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
    .min(1, `${label} is required.`)
    .refine(isHttpUrl, 'Enter a full http(s) address, e.g. https://…');

export const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isHttpUrl(value),
    'Enter a full http(s) address, e.g. https://…',
  );

export const email = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).email('Enter a valid email address.');
export const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || z.email().safeParse(value).success,
    'Enter a valid email address.',
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
  'This looks like a credential. Cerebro must never store passwords, tokens or keys — reference the secrets manager instead.';

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
