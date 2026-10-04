import type {
  AuditMetadata,
  EntityId,
  IsoDate,
  PersonId,
  StakeholderRole,
} from '@/domains/shared/types';
import type { ProjectId } from '@/domains/projects/types';

export type AllocationId = EntityId;

/** Allocation is planned in steps of 5 % of a full-time week. */
export const ALLOCATION_PERCENT = { min: 5, max: 100, step: 5 } as const;
/** A person is fully loaded at 100 %; above that they are over-allocated. */
export const FULL_LOAD = 100;

/**
 * A person planned onto a project for a period at a share of their time (a row of
 * `resource_allocations`). Several allocations may overlap — that is parallel work, and the
 * point of resource planning is to see and manage it. Dates are inclusive.
 */
export interface Allocation {
  id: AllocationId;
  personId: PersonId;
  projectId: ProjectId;
  /** What the person does on the project (`stakeholderRoles` code). */
  role: StakeholderRole;
  startDate: IsoDate;
  endDate: IsoDate;
  /** Share of a full-time week, 5–100. */
  percent: number;
  note: string;
  audit: AuditMetadata;
}

export type AllocationInput = Omit<Allocation, 'id' | 'audit'>;

/** Allocations overlapping `[from, to]` (inclusive), optionally for some people or projects. */
export interface AllocationQuery {
  from: IsoDate;
  to: IsoDate;
  personIds?: PersonId[];
  projectIds?: ProjectId[];
}
