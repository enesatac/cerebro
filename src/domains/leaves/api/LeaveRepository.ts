import type { WriteRepository } from '@/domains/shared/types';
import type { LeaveId, LeaveInput, LeaveQuery, LeaveRecord } from '../types';

/** Reads are open to every signed-in user; writes require `leaves:manage` (administrators). */
export interface LeaveRepository extends WriteRepository<LeaveRecord, LeaveInput> {
  /** Leaves that overlap the period, ordered by start date. */
  list(query: LeaveQuery): Promise<LeaveRecord[]>;
  /** @throws NotFoundError */
  getById(id: LeaveId): Promise<LeaveRecord>;
}
