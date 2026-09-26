import { useQuery } from '@tanstack/react-query';
import type { TeamId } from '@/domains/shared/types';
import { useRepositories } from '@/services/RepositoryContext';

const REFERENCE_STALE_TIME = 10 * 60_000;

export const teamKeys = {
  all: ['teams'] as const,
  summaries: () => ['teams', 'summaries'] as const,
  detail: (id: TeamId) => ['teams', 'detail', id] as const,
};

export function useTeams() {
  const { teams } = useRepositories();
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: () => teams.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => [...list].sort((a, b) => a.name.localeCompare(b.name)),
  });
}

export function useTeamsById() {
  const { teams } = useRepositories();
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: () => teams.list(),
    staleTime: REFERENCE_STALE_TIME,
    select: (list) => new Map(list.map((team) => [team.id, team])),
  });
}

export function useTeamSummaries() {
  const { teams } = useRepositories();
  return useQuery({ queryKey: teamKeys.summaries(), queryFn: () => teams.listSummaries() });
}

export function useTeam(id: TeamId) {
  const { teams } = useRepositories();
  return useQuery({ queryKey: teamKeys.detail(id), queryFn: () => teams.getById(id) });
}

export function useTeamOptions() {
  const teams = useTeams();
  return (teams.data ?? []).map((team) => ({ value: team.id, label: team.name }));
}
