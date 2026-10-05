import type { AuditMetadata, EntityId, IsoDate, PersonId } from '@/domains/shared/types';

export type ReleaseId = EntityId;

/** Seed release types (`releaseTypes`); administrators can add more. */
export const RELEASE_TYPES = [
  'major',
  'minor',
  'patch',
  'hotfix',
  'configuration',
  'infrastructure',
] as const;

/** Status of a release (`releaseStatuses`); the calendar and the figures rely on these codes. */
export const RELEASE_STATUSES = [
  'planned',
  'approved',
  'in-progress',
  'completed',
  'rolled-back',
  'cancelled',
] as const;

/** Went live (or was attempted): the window is over. */
export const FINISHED_RELEASE_STATUSES: readonly string[] = ['completed', 'rolled-back'];

/**
 * A production release (canlı geçiş) of an application, optionally delivered by a project: what
 * goes live (release number, version, scope), when (date and window), who runs it, whether the
 * service is interrupted, how it is rolled back and how it went.
 */
export interface Release {
  id: ReleaseId;
  /** The change or release number from the organisation's process, e.g. `CHG-2026-0412`. */
  releaseNumber: string;
  title: string;
  applicationId: EntityId;
  projectId: EntityId | null;
  /** `releaseTypes` code. */
  type: string;
  /** `releaseStatuses` code. */
  status: string;
  plannedDate: IsoDate;
  /** `HH:mm` or `''`; an end before the start means the window runs past midnight. */
  startTime: string;
  endTime: string;
  /** Version going live, e.g. `4.12.0`. */
  version: string;
  /** Who runs the release. */
  ownerId: PersonId | null;
  /** Users cannot use the service during the window. */
  serviceInterruption: boolean;
  /** What changes: scope, tickets, risks. Never credentials. */
  description: string;
  rollbackPlan: string;
  /** How it went (filled in afterwards). */
  outcomeNote: string;
  audit: AuditMetadata;
}

export type ReleaseInput = Omit<Release, 'id' | 'audit'>;

/** Releases on a date range (inclusive) and/or of one application or project. */
export interface ReleaseQuery {
  from?: IsoDate;
  to?: IsoDate;
  applicationId?: EntityId;
  projectId?: EntityId;
}
