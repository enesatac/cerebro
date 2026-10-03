import type { DeletionImpact, EntityId } from '@/domains/shared/types';
import type { Demand, DemandAssessmentInput, DemandId, DemandInput } from '../types';

/**
 * Demands are visible to every signed-in user. Anyone with `demands:submit` may raise one and
 * change or withdraw their own until it is decided; `demands:manage` (the portfolio office)
 * assesses, schedules, edits and deletes any demand.
 */
export interface DemandRepository {
  /** Every demand, newest submission first. */
  list(): Promise<Demand[]>;
  /** @throws NotFoundError */
  getById(id: DemandId): Promise<Demand>;
  /** Submits a new demand (status `submitted`). */
  create(input: DemandInput): Promise<Demand>;
  /** Changes the request. A requester answering "needs info" sends it back to `submitted`. */
  update(id: DemandId, input: DemandInput): Promise<Demand>;
  /** Records the assessment; a status change is added to the history with the decision note. */
  assess(id: DemandId, input: DemandAssessmentInput): Promise<Demand>;
  /** The requester (or the portfolio office) takes the demand back. */
  withdraw(id: DemandId, note: string): Promise<Demand>;
  remove(id: EntityId): Promise<void>;
  getDeletionImpact(id: EntityId): Promise<DeletionImpact>;
}
