import { CRITICALITIES, type Criticality } from '@/domains/shared/types';

/** Active items first, then highest severity first. Stable for equal keys. */
export function prioritise<T extends { severity: Criticality }>(
  items: readonly T[],
  isActive: (item: T) => boolean,
): T[] {
  return [...items].sort(
    (a, b) =>
      Number(isActive(b)) - Number(isActive(a)) ||
      CRITICALITIES.indexOf(b.severity) - CRITICALITIES.indexOf(a.severity),
  );
}
