/** Stable string identifier. Aliases document intent (`ApplicationId`, `PersonId`, …). */
export type EntityId = string;
export type PersonId = EntityId;
export type TeamId = EntityId;

/** ISO-8601 calendar date (`2026-03-14`). */
export type IsoDate = string;
/** ISO-8601 timestamp (`2026-03-14T09:30:00Z`). */
export type IsoDateTime = string;

/** A resolved reference to another entity, used inside read models. */
export interface EntityRef {
  id: EntityId;
  name: string;
}

/**
 * Audit metadata carried by every aggregate. `*By` fields are person ids.
 * A full change history (old/new values) is a future audit-log concern; these fields
 * are the minimum needed for staleness detection and "last changed by" display.
 */
export interface AuditMetadata {
  createdAt: IsoDateTime;
  createdBy: PersonId;
  updatedAt: IsoDateTime;
  updatedBy: PersonId;
  lastReviewedAt: IsoDateTime | null;
  lastReviewedBy: PersonId | null;
}

export const CRITICALITIES = ['low', 'medium', 'high', 'critical'] as const;
/** Business criticality / severity scale shared by applications, dependencies, risks, escalations. */
export type Criticality = (typeof CRITICALITIES)[number];

export const STAKEHOLDER_ROLES = [
  'business-owner',
  'technical-owner',
  'product-owner',
  'sponsor',
  'project-manager',
  'technical-lead',
  'analyst-lead',
  'analyst',
  'architect',
  'developer',
  'support',
  'stakeholder',
] as const;
/** Code from an administrable master data list; `STAKEHOLDER_ROLES` are the system values. */
export type StakeholderRole = string;

/** A person holding a role *in the context of* an application or project. */
export interface RoleAssignment {
  personId: PersonId;
  role: StakeholderRole;
}

export const TEAM_RESPONSIBILITIES = ['development', 'support', 'operations', 'delivery'] as const;
/** Code from an administrable master data list; `TEAM_RESPONSIBILITIES` are the system values. */
export type TeamResponsibility = string;

export interface TeamAssignment {
  teamId: TeamId;
  responsibility: TeamResponsibility;
}

export const DOCUMENTATION_LINK_TYPES = [
  'confluence',
  'jira',
  'repository',
  'architecture',
  'analysis',
  'design',
  'testing',
  'deployment',
  'runbook',
  'monitoring',
  'dashboard',
  'other',
] as const;
/** Code from an administrable master data list; `DOCUMENTATION_LINK_TYPES` are the system values. */
export type DocumentationLinkType = string;

export interface DocumentationLink {
  id: EntityId;
  type: DocumentationLinkType;
  title: string;
  url: string;
  description?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortSpec<TField extends string> {
  field: TField;
  direction: SortDirection;
}

export interface PageRequest {
  /** Zero-based page index. */
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** What deleting a record would affect, shown in the confirmation dialog before deletion. */
export interface DeletionImpact {
  /** e.g. `{ label: 'projects', count: 3 }` → "3 projects". Zero counts are omitted. */
  references: { label: string; count: number }[];
  /** When set, deletion is refused and this explains why (e.g. a technology still in use). */
  blockedReason: string | null;
}

/** Standard write operations for an aggregate. `TInput` excludes `id` and `audit` (server-owned). */
export interface WriteRepository<TEntity, TInput> {
  /** @throws ForbiddenError, ValidationError */
  create(input: TInput): Promise<TEntity>;
  /** @throws ForbiddenError, ValidationError, NotFoundError */
  update(id: EntityId, input: TInput): Promise<TEntity>;
  /** @throws ForbiddenError, ValidationError (when blocked), NotFoundError */
  remove(id: EntityId): Promise<void>;
  getDeletionImpact(id: EntityId): Promise<DeletionImpact>;
}
