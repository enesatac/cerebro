import type { TeamId, WriteRepository } from '@/domains/shared/types';
import type { Team, TeamInput, TeamListItem } from '../types';

export interface TeamRepository extends WriteRepository<Team, TeamInput> {
  list(): Promise<Team[]>;
  /** Teams with manager and ownership counts resolved. */
  listSummaries(): Promise<TeamListItem[]>;
  /** @throws NotFoundError */
  getById(id: TeamId): Promise<Team>;
}
