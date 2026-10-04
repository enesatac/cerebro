import type { AuditMetadata, EntityId, IsoDate, PersonId } from '@/domains/shared/types';

export type LeaveId = EntityId;

/** Seed leave types; administrators can add more in master data (`leaveTypes`). */
export const LEAVE_TYPES = ['annual', 'sick', 'excuse', 'training', 'unpaid'] as const;
/** Code from the `leaveTypes` master data list. */
export type LeaveType = string;

/**
 * A person's absence (a row of `leave_records`). Dates are inclusive calendar days; weekends
 * inside the range do not count as used leave days.
 */
export interface LeaveRecord {
  id: LeaveId;
  personId: PersonId;
  type: LeaveType;
  startDate: IsoDate;
  endDate: IsoDate;
  /** Optional context for colleagues ("Yıllık izin — yurt dışı"); never medical details. */
  note: string;
  audit: AuditMetadata;
}

export type LeaveInput = Omit<LeaveRecord, 'id' | 'audit'>;

/** Leaves overlapping `[from, to]` (inclusive), optionally for some people only. */
export interface LeaveQuery {
  from: IsoDate;
  to: IsoDate;
  personIds?: PersonId[];
}
