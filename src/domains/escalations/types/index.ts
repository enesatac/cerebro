import type { ApplicationId } from '@/domains/applications/types';
import type { ProjectId } from '@/domains/projects/types';
import type {
  AuditMetadata,
  Criticality,
  EntityId,
  IsoDate,
  IsoDateTime,
  PersonId,
  TeamId,
} from '@/domains/shared/types';

export const ESCALATION_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];

export interface Escalation {
  id: EntityId;
  title: string;
  description: string;
  severity: Criticality;
  status: EscalationStatus;
  ownerId: PersonId | null;
  responsibleTeamId: TeamId | null;
  raisedById: PersonId;
  raisedAt: IsoDateTime;
  targetResolutionDate: IsoDate | null;
  resolution: string | null;
  relatedProjectIds: ProjectId[];
  relatedApplicationIds: ApplicationId[];
  audit: AuditMetadata;
}

export type EscalationInput = Omit<Escalation, 'id' | 'audit'>;
