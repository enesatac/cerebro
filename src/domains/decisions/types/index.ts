import type { ApplicationId } from '@/domains/applications/types';
import type { ProjectId } from '@/domains/projects/types';
import type { AuditMetadata, EntityId, IsoDate, PersonId } from '@/domains/shared/types';

export const DECISION_STATUSES = [
  'proposed',
  'accepted',
  'rejected',
  'superseded',
  'deprecated',
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

/** Lightweight Architecture Decision Record. */
export interface Decision {
  id: EntityId;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  consequences: string;
  decisionDate: IsoDate;
  decidedByIds: PersonId[];
  status: DecisionStatus;
  relatedProjectIds: ProjectId[];
  relatedApplicationIds: ApplicationId[];
  audit: AuditMetadata;
}

export type DecisionInput = Omit<Decision, 'id' | 'audit'>;
