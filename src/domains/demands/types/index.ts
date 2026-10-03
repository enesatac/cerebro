import type { BusinessUnitId } from '@/domains/business-units/types';
import type {
  AuditMetadata,
  EntityId,
  IsoDate,
  IsoDateTime,
  PersonId,
} from '@/domains/shared/types';

export type DemandId = EntityId;

/**
 * Workflow of a demand (`demandStatuses`). The codes are system values: the repository enforces
 * the rules attached to them (a scheduled demand has dates, a rejected one has a reason…).
 */
export const DEMAND_STATUSES = [
  'submitted',
  'in-review',
  'needs-info',
  'approved',
  'scheduled',
  'converted',
  'rejected',
  'withdrawn',
] as const;
/** Code from the `demandStatuses` master data list. */
export type DemandStatus = string;

/** Still waiting for a decision — the triage inbox. */
export const INBOX_STATUSES: readonly DemandStatus[] = ['submitted', 'in-review', 'needs-info'];
/** No further work: delivered as a project, turned down or taken back. */
export const CLOSED_STATUSES: readonly DemandStatus[] = ['converted', 'rejected', 'withdrawn'];
/** The requester may still change the request (before a decision, or when asked for more). */
export const REQUESTER_EDITABLE_STATUSES: readonly DemandStatus[] = ['submitted', 'needs-info'];

/** Seed demand types; administrators can add more in master data (`demandTypes`). */
export const DEMAND_TYPES = [
  'new-project',
  'new-application',
  'enhancement',
  'integration',
  'reporting',
  'infrastructure',
  'compliance',
] as const;
/** Code from the `demandTypes` master data list. */
export type DemandType = string;

/** Seed benefit kinds; administrators can add more in master data (`demandBenefitTypes`). */
export const DEMAND_BENEFIT_TYPES = [
  'revenue',
  'cost-saving',
  'customer-experience',
  'efficiency',
  'compliance',
  'risk-reduction',
] as const;
/** Code from the `demandBenefitTypes` master data list. */
export type DemandBenefitType = string;

/** Decided priority (`demandPriorities`); `p1` is the most urgent. */
export const DEMAND_PRIORITIES = ['p1', 'p2', 'p3', 'p4'] as const;
/** Code from the `demandPriorities` master data list. */
export type DemandPriority = string;

/** 1 (lowest) … 5 (highest). */
export type DemandScore = 1 | 2 | 3 | 4 | 5;
export const DEMAND_SCORES: readonly DemandScore[] = [1, 2, 3, 4, 5];

/**
 * The portfolio office's assessment. Scores follow WSJF: value, strategic fit, time criticality and
 * risk reduction against the effort; the score suggests a priority, the decided one is `priority`.
 */
export interface DemandAssessment {
  businessValue: DemandScore | null;
  strategicFit: DemandScore | null;
  timeCriticality: DemandScore | null;
  riskReduction: DemandScore | null;
  /** 1 = a few weeks of one team … 5 = a year or more across teams. */
  effort: DemandScore | null;
  priority: DemandPriority | null;
  /** Who in the portfolio office looks after the demand. */
  assessorId: PersonId | null;
  plannedStart: IsoDate | null;
  plannedEnd: IsoDate | null;
  /** Reasoning or feedback for the requester; required to reject or to ask for information. */
  decisionNote: string;
  /** The project the demand became (`converted`). */
  projectId: EntityId | null;
}

/** A status change on a demand (a row of `demand_events`); written by the server only. */
export interface DemandEvent {
  id: EntityId;
  at: IsoDateTime;
  byId: PersonId | null;
  status: DemandStatus;
  note: string;
}

/**
 * A request for change from a business unit (a row of `demands`): what is needed and why, filled
 * in by the requester, plus the portfolio office's assessment and schedule.
 */
export interface Demand {
  id: DemandId;
  /** Human-readable reference assigned by the server (`TLP-0012`). */
  code: string;
  title: string;
  type: DemandType;
  businessUnitId: BusinessUnitId;
  requesterId: PersonId;
  sponsorId: PersonId | null;
  /** Today's situation and the problem to solve. */
  problem: string;
  /** What the requester has in mind; scope and out of scope. */
  proposedSolution: string;
  expectedBenefits: string;
  benefitTypes: DemandBenefitType[];
  /** The requester's view of urgency (`criticalities`). */
  urgency: string;
  desiredDate: IsoDate | null;
  /** Why the date matters (a regulation, a campaign, a contract end…). */
  deadlineReason: string;
  /** Required by law or a regulator. */
  regulatory: boolean;
  affectedUsers: number | null;
  estimatedBudget: number | null;
  /** Currency of `estimatedBudget` (`currencies`). */
  currency: string;
  relatedApplicationIds: EntityId[];
  status: DemandStatus;
  submittedAt: IsoDateTime;
  assessment: DemandAssessment;
  /** Oldest first. */
  history: DemandEvent[];
  audit: AuditMetadata;
}

/** What the requester fills in. */
export type DemandInput = Pick<
  Demand,
  | 'title'
  | 'type'
  | 'businessUnitId'
  | 'requesterId'
  | 'sponsorId'
  | 'problem'
  | 'proposedSolution'
  | 'expectedBenefits'
  | 'benefitTypes'
  | 'urgency'
  | 'desiredDate'
  | 'deadlineReason'
  | 'regulatory'
  | 'affectedUsers'
  | 'estimatedBudget'
  | 'currency'
  | 'relatedApplicationIds'
>;

/** What the portfolio office decides. */
export type DemandAssessmentInput = DemandAssessment & { status: DemandStatus };
