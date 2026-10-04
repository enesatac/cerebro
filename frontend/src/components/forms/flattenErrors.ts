import type { FieldErrors, FieldValues } from 'react-hook-form';

/** Collects every error message in a (nested) react-hook-form error tree, depth-first. */
export function flattenErrors<T extends FieldValues>(errors: FieldErrors<T>): string[] {
  const messages: string[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message) messages.push(record.message);
    for (const [key, value] of Object.entries(record)) {
      if (key !== 'ref' && key !== 'message' && key !== 'type' && key !== 'types') visit(value);
    }
  };
  visit(errors);
  return [...new Set(messages)];
}
