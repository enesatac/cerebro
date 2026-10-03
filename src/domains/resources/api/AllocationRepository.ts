import type { WriteRepository } from '@/domains/shared/types';
import type { Allocation, AllocationId, AllocationInput, AllocationQuery } from '../types';

/** Reads are open to every signed-in user; writes require `resources:edit` (administrators). */
export interface AllocationRepository extends WriteRepository<Allocation, AllocationInput> {
  /** Allocations that overlap the period, ordered by start date. */
  list(query: AllocationQuery): Promise<Allocation[]>;
  /** @throws NotFoundError */
  getById(id: AllocationId): Promise<Allocation>;
}
