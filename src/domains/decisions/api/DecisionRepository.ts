import type { RelatedEntityFilter } from '@/domains/risks/types';
import type { EntityId, WriteRepository } from '@/domains/shared/types';
import type { Decision, DecisionInput } from '../types';

export interface DecisionRepository extends WriteRepository<Decision, DecisionInput> {
  list(filter?: RelatedEntityFilter): Promise<Decision[]>;
  /** @throws NotFoundError */
  getById(id: EntityId): Promise<Decision>;
}
