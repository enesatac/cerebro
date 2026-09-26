import type { WriteRepository } from '@/domains/shared/types';
import type { Technology, TechnologyId, TechnologyInput, TechnologyListItem } from '../types';

export interface TechnologyRepository extends WriteRepository<Technology, TechnologyInput> {
  list(): Promise<Technology[]>;
  /** Catalogue with usage counts. */
  listSummaries(): Promise<TechnologyListItem[]>;
  /** @throws NotFoundError */
  getById(id: TechnologyId): Promise<Technology>;
}
