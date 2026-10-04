import { useQuery } from '@tanstack/react-query';
import type { IsoDate, PersonId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';

/** Reference catalogues change rarely; cache them for the session. */
const REFERENCE_STALE_TIME = 10 * 60_000;

export const personKeys = {
  all: ['people'] as const,
  workload: (id: PersonId, today: IsoDate) => ['people', 'workload', id, today] as const,
};

/** All people as an id → Person map. */
export function usePeopleById() {
  const { people } = useRepositories();
  return useQuery({
    queryKey: personKeys.all,
    queryFn: () => people.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => new Map(list.map((person) => [person.id, person])),
  });
}

/** People as Select options, "Name — Job title", sorted by name. */
export function usePersonOptions() {
  const people = usePeopleById();
  return [...(people.data?.values() ?? [])]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((person) => ({
      value: String(person.id),
      label: `${person.fullName} — ${person.jobTitle}`,
    }));
}

/** Everything a person is mapped to (person page). */
export function usePersonWorkload(id: PersonId, today: IsoDate) {
  const { people } = useRepositories();
  return useQuery({
    queryKey: personKeys.workload(id, today),
    queryFn: () => people.getWorkload(id, today),
  });
}
