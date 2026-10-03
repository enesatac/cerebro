import type { Privilege, SessionUser, UserAccount } from '@/domains/auth/types';
import type { AuditMetadata, Draft, EntityId } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import type { SequenceName, Sequences } from './database';
import { delay } from './query';
import { MockAuthority } from './session';

/** Shared mechanics of mock writes: auth check, latency, audit stamping, ids and reference checks. */
export class WriteKit {
  constructor(
    readonly authority: MockAuthority,
    private readonly latencyMs: number,
    private readonly sequences: Sequences,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Simulated round trip, then the server-side permission check. */
  async begin(privilege: Privilege): Promise<SessionUser> {
    await delay(this.latencyMs);
    return this.authority.require(privilege);
  }

  /** Like `begin`, for operations open to holders of any of `privileges`. */
  async beginAny(privileges: readonly Privilege[]): Promise<SessionUser> {
    await delay(this.latencyMs);
    return this.authority.requireAny(privileges);
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

  /** `nextval('<table>_id_seq')`: primary keys are never reused, even after deletes. */
  nextId(sequence: SequenceName): EntityId {
    this.sequences[sequence] += 1;
    return this.sequences[sequence];
  }

  /**
   * Stores child rows: existing rows keep their id, new rows (`id: null`) get the next one.
   * `existing` are the ids the parent already owns; any other id is refused so a request cannot
   * take over another record's rows (what a composite foreign key enforces in the database).
   */
  withIds<T extends { id: EntityId }>(
    rows: readonly Draft<T>[],
    sequence: SequenceName,
    existing: readonly { id: EntityId }[] = [],
  ): T[] {
    const owned = new Set(existing.map((row) => row.id));
    return rows.map((row) => {
      if (row.id !== null && !owned.has(row.id)) {
        throw new ValidationError(`Geçersiz alt kayıt kimliği: ${row.id}.`);
      }
      return { ...row, id: row.id ?? this.nextId(sequence) } as T;
    });
  }

  /** Throws when any non-null id does not exist in `rows`. */
  assertRefs(
    ids: readonly (EntityId | null | undefined)[],
    rows: readonly { id: EntityId }[],
    label: string,
    field?: string,
  ) {
    const known = new Set(rows.map((row) => row.id));
    const unknown = ids.filter((id): id is EntityId => id != null && !known.has(id));
    if (unknown.length > 0) {
      throw new ValidationError(`Bilinmeyen ${label}: ${unknown.join(', ')}.`, field);
    }
  }

  /** Case-insensitive uniqueness check on a text field (Turkish I/İ/ı/i compare equal). */
  assertUnique<T extends { id: EntityId }>(
    rows: readonly T[],
    value: string,
    read: (row: T) => string,
    excludeId: EntityId | null,
    message: string,
    field: string,
  ) {
    const fold = (text: string) => text.trim().toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');
    const needle = fold(value);
    if (rows.some((row) => row.id !== excludeId && fold(read(row)) === needle)) {
      throw new ValidationError(message, field);
    }
  }
}

/** Replaces the row with `id` in place; returns the stored copy. */
export function replaceRow<T extends { id: EntityId }>(rows: T[], next: T): T {
  const index = rows.findIndex((row) => row.id === next.id);
  rows[index] = next;
  return next;
}

export function removeRow<T extends { id: EntityId }>(rows: T[], id: EntityId) {
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) rows.splice(index, 1);
}
