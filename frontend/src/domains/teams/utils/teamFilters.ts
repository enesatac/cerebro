import type { TeamListItem } from '../types';

/** Case-insensitive match on name, description and manager. */
export function filterTeams(teams: readonly TeamListItem[], search: string): TeamListItem[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return [...teams];
  return teams.filter((team) =>
    [team.name, team.description, team.manager?.name ?? ''].some((field) =>
      field.toLowerCase().includes(needle),
    ),
  );
}
