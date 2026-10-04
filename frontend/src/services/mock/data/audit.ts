import type { AuditMetadata, PersonId } from '@/domains/shared/types';

interface AuditSeed {
  created: string;
  updated: string;
  /** `null` = never reviewed. */
  reviewed: string | null;
  by: PersonId;
  reviewer?: PersonId;
}

/** Compact builder for seed audit metadata (dates are `YYYY-MM-DD`). */
export function auditOf({ created, updated, reviewed, by, reviewer }: AuditSeed): AuditMetadata {
  return {
    createdAt: `${created}T09:00:00Z`,
    createdBy: by,
    updatedAt: `${updated}T14:30:00Z`,
    updatedBy: by,
    lastReviewedAt: reviewed ? `${reviewed}T10:00:00Z` : null,
    lastReviewedBy: reviewed ? (reviewer ?? by) : null,
  };
}
