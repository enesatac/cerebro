import type { EntityId, WriteRepository } from '@/domains/shared/types';
import type { RelatedEntityFilter, Risk, RiskInput } from '../types';

export interface RiskRepository extends WriteRepository<Risk, RiskInput> {
  list(filter?: RelatedEntityFilter): Promise<Risk[]>;
  /** @throws NotFoundError */
  getById(id: EntityId): Promise<Risk>;
}
