import type { EntityRef } from '@/domains/shared/types';
import type { MockDatabase } from './database';

/** Id → display-name resolution over the mock tables (what a backend join would do). */
export function createLookup(db: MockDatabase) {
  const personNames = new Map(db.people.map((p) => [p.id, p.fullName]));
  const teamNames = new Map(db.teams.map((t) => [t.id, t.name]));
  const businessUnitNames = new Map(db.businessUnits.map((b) => [b.id, b.name]));

  const ref = (names: Map<string, string>, id: string | null | undefined): EntityRef | null => {
    if (!id) return null;
    const name = names.get(id);
    return name === undefined ? null : { id, name };
  };

  return {
    person: (id: string | null | undefined) => ref(personNames, id),
    team: (id: string | null | undefined) => ref(teamNames, id),
    businessUnit: (id: string | null | undefined) => ref(businessUnitNames, id),
  };
}

export type Lookup = ReturnType<typeof createLookup>;
