import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';

const REFERENCE_STALE_TIME = 10 * 60_000;

export const businessUnitKeys = { all: ['business-units'] as const };

export function useBusinessUnits() {
  const { businessUnits } = useRepositories();
  return useQuery({
    queryKey: businessUnitKeys.all,
    queryFn: () => businessUnits.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => [...list].sort((a, b) => a.name.localeCompare(b.name)),
  });
}

export function useBusinessUnitsById() {
  const { businessUnits } = useRepositories();
  return useQuery({
    queryKey: businessUnitKeys.all,
    queryFn: () => businessUnits.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => new Map(list.map((unit) => [unit.id, unit])),
  });
}

export function useBusinessUnitOptions() {
  const units = useBusinessUnits();
  return (units.data ?? []).map((unit) => ({ value: String(unit.id), label: unit.name }));
}
