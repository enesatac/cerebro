import type { RelatedEntityFilter } from '@/domains/risks/types';
import type { EntityId, WriteRepository } from '@/domains/shared/types';
import type { Escalation, EscalationInput } from '../types';

export interface EscalationRepository extends WriteRepository<Escalation, EscalationInput> {
  list(filter?: RelatedEntityFilter): Promise<Escalation[]>;
  /** @throws NotFoundError */
  getById(id: EntityId): Promise<Escalation>;
}
