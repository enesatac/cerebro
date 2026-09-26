import type { ApplicationId } from '@/domains/applications/types';
import type { ProjectId } from '@/domains/projects/types';
import type {
  AuditMetadata,
  Criticality,
  EntityId,
  IsoDate,
  PersonId,
} from '@/domains/shared/types';

export const RISK_CATEGORIES = [
  'technical',
  'security',
  'operational',
  'compliance',
  'delivery',
  'financial',
  'vendor',
] as const;
/** Code from an administrable master data list; `RISK_CATEGORIES` are the system values. */
export type RiskCategory = string;

export const RISK_LIKELIHOODS = ['low', 'medium', 'high'] as const;
export type RiskLikelihood = (typeof RISK_LIKELIHOODS)[number];

export const RISK_STATUSES = ['open', 'monitoring', 'mitigated', 'accepted', 'closed'] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export interface Risk {
  id: EntityId;
  title: string;
  description: string;
  category: RiskCategory;
  probability: RiskLikelihood;
  impact: RiskLikelihood;
  severity: Criticality;
  status: RiskStatus;
  ownerId: PersonId | null;
  mitigationPlan: string;
  dueDate: IsoDate | null;
  relatedProjectIds: ProjectId[];
  relatedApplicationIds: ApplicationId[];
  audit: AuditMetadata;
}

/** Filters shared by the operational-knowledge repositories (risks, escalations, decisions). */
export interface RelatedEntityFilter {
  applicationId?: ApplicationId;
  projectId?: ProjectId;
}

export type RiskInput = Omit<Risk, 'id' | 'audit'>;
