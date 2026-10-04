import type { ApplicationTeamRef } from '../types';

/**
 * The team(s) that build and change the application — what people usually mean by "the team".
 * Falls back to any assigned team (e.g. support-only for vendor products).
 */
export function getPrimaryTeams(teams: readonly ApplicationTeamRef[]): ApplicationTeamRef[] {
  const builders = teams.filter(
    (team) => team.responsibility === 'development' || team.responsibility === 'delivery',
  );
  const chosen = builders.length > 0 ? builders : teams;
  return chosen.filter(
    (team, index) => chosen.findIndex((other) => other.id === team.id) === index,
  );
}
