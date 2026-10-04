import type { AuditMetadata, EntityRef, PersonId, TeamId } from '@/domains/shared/types';

export interface Team {
  id: TeamId;
  name: string;
  description: string;
  managerId: PersonId | null;
  memberIds: PersonId[];
  /** Shared team mailbox or distribution list — not a personal address. */
  contactEmail: string | null;
  /** Chat channel handle, e.g. `#platform-team`. */
  chatChannel: string | null;
  responsibilities: string[];
  audit: AuditMetadata;
}

/** Team row with ownership counts, built by the repository. */
export interface TeamListItem {
  id: TeamId;
  name: string;
  description: string;
  manager: EntityRef | null;
  memberCount: number;
  /** Applications the team develops or supports. */
  applicationCount: number;
  /** Projects the team delivers. */
  projectCount: number;
  contactEmail: string | null;
  chatChannel: string | null;
}

export type TeamInput = Omit<Team, 'id' | 'audit'>;
