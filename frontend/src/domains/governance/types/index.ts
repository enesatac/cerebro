import type { ApplicationLifecycle } from '@/domains/applications/types';
import type { MilestoneStatus } from '@/domains/projects/types';
import type {
  Criticality,
  EntityId,
  EntityRef,
  IsoDate,
  IsoDateTime,
} from '@/domains/shared/types';
import type { TechnologyStatus } from '@/domains/technologies/types';
import type { ReviewState } from '../utils/staleness';

export type CompletenessImportance = 'required' | 'recommended';

/**
 * One data-quality rule. Rules are data, not code paths: products can reorder, reweight or
 * disable them without touching the UI. `appliesTo` lets a rule opt out for entities where it
 * makes no sense (e.g. repositories for a vendor-hosted SaaS product).
 */
export interface CompletenessRule<T> {
  /** Rule key (not a table row). */
  id: string;
  label: string;
  /** Explains what "passing" means, shown next to failing rules. */
  description: string;
  importance: CompletenessImportance;
  weight: number;
  appliesTo?: (entity: T) => boolean;
  isSatisfied: (entity: T) => boolean;
}

export interface CompletenessRuleResult {
  id: string;
  label: string;
  description: string;
  importance: CompletenessImportance;
  satisfied: boolean;
}

export interface CompletenessReport {
  /** 0–100, weighted share of applicable rules satisfied. */
  score: number;
  results: CompletenessRuleResult[];
  missing: CompletenessRuleResult[];
}

// ---------- Portfolio overview & reports ----------

/** Something a portfolio owner should act on. Built by rules in `utils/attention.ts`. */
export type AttentionKind =
  | 'missing-technical-owner'
  | 'review-overdue'
  | 'retired-technology'
  | 'critical-risk'
  | 'active-escalation'
  | 'overdue-milestone'
  | 'project-health';

export type AttentionSubjectKind = 'application' | 'project' | 'risk' | 'escalation';

export interface AttentionItem {
  /** Derived key, e.g. `owner-12` (attention items are computed, not stored). */
  id: string;
  kind: AttentionKind;
  severity: Criticality;
  subject: { kind: AttentionSubjectKind; id: EntityId; name: string };
  /** One-line explanation, e.g. "No technical owner assigned". */
  reason: string;
  /** Date that makes the item relevant (due date, raised date…), when there is one. */
  date: IsoDateTime | null;
}

export interface LifecycleCount {
  lifecycle: ApplicationLifecycle;
  count: number;
}

export interface RecentlyUpdatedEntry {
  kind: 'application' | 'project';
  id: EntityId;
  name: string;
  code: string;
  updatedAt: IsoDateTime;
  updatedBy: EntityRef | null;
}

export interface UpcomingMilestone {
  projectId: EntityId;
  projectName: string;
  milestoneId: EntityId;
  title: string;
  dueDate: IsoDateTime;
  status: MilestoneStatus;
}

export interface PortfolioOverview {
  applications: {
    total: number;
    active: number;
    critical: number;
    withoutTechnicalOwner: number;
    reviewOverdue: number;
  };
  projects: { total: number; inProgress: number; atRiskOrCritical: number };
  risks: { active: number; activeCritical: number };
  escalations: { active: number; activeCritical: number };
  lifecycleDistribution: LifecycleCount[];
  attention: AttentionItem[];
  recentlyUpdated: RecentlyUpdatedEntry[];
  upcomingMilestones: UpcomingMilestone[];
}

/** One application's data-quality and technology-risk profile. */
export interface ApplicationHealthRow {
  id: EntityId;
  name: string;
  code: string;
  lifecycle: ApplicationLifecycle;
  criticality: Criticality;
  businessUnit: EntityRef | null;
  technicalOwner: EntityRef | null;
  completenessScore: number;
  missingRequired: string[];
  missingRecommended: string[];
  reviewState: ReviewState;
  /** Deprecated or retired catalogue technologies still in use. */
  outdatedTechnologies: (EntityRef & { status: TechnologyStatus })[];
  activeRiskCount: number;
  activeEscalationCount: number;
}

// ---------- Trend reports (charts) ----------

/** Months shown by the trend reports: `months` whole months starting at `from` (a 1st). */
export interface ReportPeriod {
  from: IsoDate;
  months: number;
}

/**
 * One line or stack layer of a monthly chart. `key` is a master data code, an entity id (as
 * text) or a fixed key; the UI resolves labels and colours. `values` align with `months`;
 * `null` means "no data" (drawn as a gap, not a zero).
 */
export interface TrendSeries {
  key: string;
  values: (number | null)[];
}

/** A count per category (master data code or entity id as text). */
export interface CategoryCount {
  key: string;
  label?: string;
  value: number;
}

/** Everything the reports' charts need, computed in one pass (an analytics endpoint later). */
export interface PortfolioTrends {
  /** First day of each month in the period. */
  months: IsoDate[];
  /** Index of the month containing today in `months`, or -1 when outside the period. */
  currentMonthIndex: number;

  /** Projects running in each month (planned dates for the future). */
  activeProjects: number[];
  /** Milestones due in each month, by status. */
  milestonesByStatus: TrendSeries[];
  /** Escalations raised per month, by severity. */
  escalationsRaised: TrendSeries[];
  /** Escalations still open at the end of each month. */
  escalationsOpenAtMonthEnd: (number | null)[];
  /** Median calendar days from raising to resolution, for escalations resolved that month. */
  escalationMedianDaysToResolve: (number | null)[];
  /** Risks registered per month, by severity. */
  risksRegistered: TrendSeries[];
  /** Decisions taken per month, by status. */
  decisionsByStatus: TrendSeries[];
  /** Planned capacity (full-time equivalents, working days) per month, by project id. */
  capacityByProject: TrendSeries[];
  /** People over 100 % on at least one day of the month. */
  overallocatedPeople: (number | null)[];
  /** Leave working days per month, by leave type. */
  leaveDaysByType: TrendSeries[];

  // Snapshot distributions (today)
  applicationsByLifecycle: CategoryCount[];
  applicationsByCriticality: CategoryCount[];
  applicationsByBusinessUnit: CategoryCount[];
  projectsByStatus: CategoryCount[];
  projectsByHealth: CategoryCount[];
  topTechnologies: CategoryCount[];
  /** Active risks by probability × impact. */
  activeRiskMatrix: { probability: string; impact: string; count: number }[];
}
