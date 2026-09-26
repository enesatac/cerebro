import type { EntityRef } from '@/domains/shared/types';
import type { MockDatabase } from './database';

/**
 * Id → display-name resolution over the mock tables (what a backend join would do). Resolved on
 * every call so renamed or newly added people, teams and business units show up immediately.
 */
export function createLookup(db: MockDatabase) {
  const ref = (
    rows: readonly { id: string }[],
    nameOf: (row: never) => string,
    id: string | null | undefined,
  ): EntityRef | null => {
    if (!id) return null;
    const row = rows.find((candidate) => candidate.id === id);
    return row ? { id, name: nameOf(row as never) } : null;
  };

  return {
    person: (id: string | null | undefined) =>
      ref(db.people, (p: MockDatabase['people'][number]) => p.fullName, id),
    team: (id: string | null | undefined) =>
      ref(db.teams, (t: MockDatabase['teams'][number]) => t.name, id),
    businessUnit: (id: string | null | undefined) =>
      ref(db.businessUnits, (b: MockDatabase['businessUnits'][number]) => b.name, id),
  };
}

export type Lookup = ReturnType<typeof createLookup>;
