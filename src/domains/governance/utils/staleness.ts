import { daysSince } from '@/lib/dates';
import type { AuditMetadata } from '@/domains/shared/types';

/** Records not reviewed within this many days are flagged for review. */
export const REVIEW_INTERVAL_DAYS = 180;

export type ReviewState =
  | { kind: 'never-reviewed' }
  | { kind: 'stale'; daysSinceReview: number }
  | { kind: 'current'; daysSinceReview: number };

export function getReviewState(
  audit: Pick<AuditMetadata, 'lastReviewedAt'>,
  now: Date = new Date(),
  intervalDays: number = REVIEW_INTERVAL_DAYS,
): ReviewState {
  const days = daysSince(audit.lastReviewedAt, now);
  if (days === null) return { kind: 'never-reviewed' };
  return days > intervalDays
    ? { kind: 'stale', daysSinceReview: days }
    : { kind: 'current', daysSinceReview: days };
}
