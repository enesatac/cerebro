import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { TechnologyId } from '../types';

const REFERENCE_STALE_TIME = 10 * 60_000;

export const technologyKeys = {
  all: ['technologies'] as const,
  summaries: () => ['technologies', 'summaries'] as const,
  detail: (id: TechnologyId) => ['technologies', 'detail', id] as const,
};

export function useTechnologies() {
  const { technologies } = useRepositories();
  return useQuery({
    queryKey: technologyKeys.all,
    queryFn: () => technologies.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => [...list].sort((a, b) => a.name.localeCompare(b.name)),
  });
}

export function useTechnologiesById() {
  const { technologies } = useRepositories();
  return useQuery({
    queryKey: technologyKeys.all,
    queryFn: () => technologies.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => new Map(list.map((technology) => [technology.id, technology])),
  });
}

export function useTechnologySummaries() {
  const { technologies } = useRepositories();
  return useQuery({
    queryKey: technologyKeys.summaries(),
    queryFn: () => technologies.listSummaries(),
  });
}

export function useTechnology(id: TechnologyId) {
  const { technologies } = useRepositories();
  return useQuery({
    queryKey: technologyKeys.detail(id),
    queryFn: () => technologies.getById(id),
  });
}

export function useTechnologyOptions() {
  const technologies = useTechnologies();
  return (technologies.data ?? []).map((tech) => ({ value: String(tech.id), label: tech.name }));
}
