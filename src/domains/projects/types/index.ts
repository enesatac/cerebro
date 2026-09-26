import type { ApplicationId } from '@/domains/applications/types';
import type { BusinessUnitId } from '@/domains/business-units/types';
import type {
  AuditMetadata,
  DocumentationLink,
  EntityId,
  EntityRef,
  IsoDate,
  PageRequest,
  RoleAssignment,
  SortSpec,
  TeamAssignment,
  TeamId,
} from '@/domains/shared/types';

export type ProjectId = EntityId;

export const PROJECT_TYPES = [
  'new-product',
  'modernisation',
  'integration',
  'regulatory',
  'infrastructure',
  'decommissioning',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export const PROJECT_STATUSES = [
  'proposed',
  'approved',
  'in-progress',
  'on-hold',
  'completed',
  'cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_HEALTHS = ['on-track', 'at-risk', 'critical', 'completed'] as const;
export type ProjectHealth = (typeof PROJECT_HEALTHS)[number];

export const PROJECT_PHASES = [
  'initiation',
  'analysis',
  'design',
  'build',
  'test',
  'deployment',
  'hypercare',
  'closure',
] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const CONFIDENTIALITY_LEVELS = ['public', 'internal', 'confidential', 'restricted'] as const;
export type ConfidentialityLevel = (typeof CONFIDENTIALITY_LEVELS)[number];

export const APPLICATION_IMPACT_TYPES = [
  'creates',
  'modifies',
  'integrates-with',
  'decommissions',
] as const;
export type ApplicationImpactType = (typeof APPLICATION_IMPACT_TYPES)[number];

/** A project's explicit relationship to an application it affects. */
export interface ProjectApplicationImpact {
  applicationId: ApplicationId;
  impactType: ApplicationImpactType;
  description: string;
}

export const MILESTONE_STATUSES = [
  'planned',
  'in-progress',
  'completed',
  'at-risk',
  'missed',
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface Milestone {
  id: EntityId;
  title: string;
  dueDate: IsoDate;
  completedDate: IsoDate | null;
  status: MilestoneStatus;
}

/**
 * Financial information is optional and expected to become permission-sensitive; keep it isolated
 * so an API can omit it entirely for unauthorised viewers.
 */
export interface ProjectFinancials {
  currency: string;
  budget: number | null;
  actualCost: number | null;
  forecastCost: number | null;
}

export interface ProjectTimeline {
  plannedStartDate: IsoDate | null;
  actualStartDate: IsoDate | null;
  plannedEndDate: IsoDate | null;
  actualEndDate: IsoDate | null;
}

export interface Project {
  id: ProjectId;
  code: string;
  name: string;
  shortName: string;
  description: string;
  objective: string;
  scope: string;
  outOfScope: string;

  type: ProjectType;
  priority: ProjectPriority;
  status: ProjectStatus;
  health: ProjectHealth;
  confidentiality: ConfidentialityLevel;
  tags: string[];

  businessUnitId: BusinessUnitId | null;
  roles: RoleAssignment[];
  teams: TeamAssignment[];

  timeline: ProjectTimeline;
  progressPercentage: number;
  currentPhase: ProjectPhase;
  latestStatusSummary: string;
  nextSteps: string;

  financials: ProjectFinancials | null;
  applicationImpacts: ProjectApplicationImpact[];
  milestones: Milestone[];
  documentation: DocumentationLink[];

  audit: AuditMetadata;
}

export interface ProjectListItem {
  id: ProjectId;
  code: string;
  name: string;
  status: ProjectStatus;
  health: ProjectHealth;
  priority: ProjectPriority;
  currentPhase: ProjectPhase;
  progressPercentage: number;
  businessUnit: EntityRef | null;
  projectManager: EntityRef | null;
  plannedEndDate: IsoDate | null;
}

/** A project as seen from one application it affects. */
export interface ApplicationProjectLink {
  project: ProjectListItem;
  impact: ProjectApplicationImpact;
}

export const PROJECT_SORT_FIELDS = [
  'name',
  'code',
  'status',
  'health',
  'priority',
  'plannedEndDate',
] as const;
export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

export interface ProjectListQuery extends PageRequest {
  search?: string;
  statuses?: ProjectStatus[];
  healths?: ProjectHealth[];
  businessUnitId?: BusinessUnitId;
  /** Projects the team delivers. */
  teamId?: TeamId;
  sort?: SortSpec<ProjectSortField>;
}

export type ProjectInput = Omit<Project, 'id' | 'audit'>;
