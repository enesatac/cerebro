import type { Permission, UserAccount } from '@/domains/auth/types';
import type { AuditMetadata } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { delay } from './query';
import { MockAuthority } from './session';

function slugify(value: string): string {
  return (
    value
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'item'
  );
}

/** Shared mechanics of mock writes: auth check, latency, audit stamping, ids and reference checks. */
export class WriteKit {
  constructor(
    readonly authority: MockAuthority,
    private readonly latencyMs: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Simulated round trip, then the server-side permission check. */
  async begin(permission: Permission = 'portfolio:edit'): Promise<UserAccount> {
    await delay(this.latencyMs);
    return this.authority.require(permission);
  }

  newAudit(user: UserAccount): AuditMetadata {
    const at = this.now().toISOString();
    const by = MockAuthority.actorId(user);
    return {
      createdAt: at,
      createdBy: by,
      updatedAt: at,
      updatedBy: by,
      lastReviewedAt: at,
      lastReviewedBy: by,
    };
  }

  /**
   * Saving a record through its form counts as a review: the editor has just looked at every
   * field. That is what keeps the staleness indicator meaningful rather than noisy.
   */
  touch(audit: AuditMetadata, user: UserAccount): AuditMetadata {
    const at = this.now().toISOString();
    const by = MockAuthority.actorId(user);
    return { ...audit, updatedAt: at, updatedBy: by, lastReviewedAt: at, lastReviewedBy: by };
  }

  /** `prefix-slug`, suffixed with a counter when taken. */
  uniqueId(prefix: string, name: string, rows: readonly { id: string }[]): string {
    const base = `${prefix}-${slugify(name)}`;
    const taken = new Set(rows.map((row) => row.id));
    if (!taken.has(base)) return base;
    for (let n = 2; ; n += 1) {
      if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
    }
  }

  /** Throws when any non-null id does not exist in `rows`. */
  assertRefs(
    ids: readonly (string | null | undefined)[],
    rows: readonly { id: string }[],
    label: string,
    field?: string,
  ) {
    const known = new Set(rows.map((row) => row.id));
    const unknown = ids.filter((id): id is string => Boolean(id) && !known.has(id as string));
    if (unknown.length > 0) {
      throw new ValidationError(`Bilinmeyen ${label}: ${unknown.join(', ')}.`, field);
    }
  }

  /** Case-insensitive uniqueness check on a text field. */
  assertUnique<T extends { id: string }>(
    rows: readonly T[],
    value: string,
    read: (row: T) => string,
    excludeId: string | null,
    message: string,
    field: string,
  ) {
    const needle = value.trim().toLowerCase();
    if (rows.some((row) => row.id !== excludeId && read(row).trim().toLowerCase() === needle)) {
      throw new ValidationError(message, field);
    }
  }
}

/** Replaces the row with `id` in place; returns the stored copy. */
export function replaceRow<T extends { id: string }>(rows: T[], next: T): T {
  const index = rows.findIndex((row) => row.id === next.id);
  rows[index] = next;
  return next;
}

export function removeRow<T extends { id: string }>(rows: T[], id: string) {
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) rows.splice(index, 1);
}
