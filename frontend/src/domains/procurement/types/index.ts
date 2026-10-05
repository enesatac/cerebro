import type { Draft, EntityId, IsoDate, IsoDateTime, PersonId } from '@/domains/shared/types';

/**
 * Seed steps of a purchase, in their usual order (`procurementSteps`); administrators can add or
 * reorder them. The active ones, in list order, are the template for a new process.
 */
export const PROCUREMENT_STEPS = [
  'need-definition',
  'market-research',
  'rfq',
  'offer-evaluation',
  'negotiation',
  'approval',
  'purchase-order',
  'contract-signing',
  'delivery',
  'acceptance',
  'invoicing',
] as const;

/** Status of one step (`procurementStepStatuses`); the logic relies on these codes. */
export const PROCUREMENT_STEP_STATUSES = [
  'not-started',
  'in-progress',
  'waiting',
  'blocked',
  'done',
  'skipped',
] as const;

/** Finished one way or another: no longer holds the process up. */
export const CLOSED_STEP_STATUSES: readonly string[] = ['done', 'skipped'];

/**
 * One step of a purchase (a row of `procurement_steps`): what, who, and when — planned against
 * actual — with a short note. Steps are ordered; the first one not done or skipped is the current
 * step.
 */
export interface ProcurementStep {
  id: EntityId;
  /** `procurementSteps` code. */
  type: string;
  /** `procurementStepStatuses` code. */
  status: string;
  ownerId: PersonId | null;
  plannedStart: IsoDate | null;
  plannedEnd: IsoDate | null;
  actualStart: IsoDate | null;
  actualEnd: IsoDate | null;
  /** What happened or what is awaited. Never credentials or bank details. */
  note: string;
}

/**
 * A note in the purchase's log. Internal notes are kept for the procurement team
 * (`procurement:edit`); everyone who may see the process reads the others.
 */
export interface ProcurementNote {
  id: EntityId;
  at: IsoDateTime;
  authorId: PersonId | null;
  text: string;
  internal: boolean;
}

/**
 * A purchase as the procurement tracker sees it: the contract's identity and status, its project
 * and supplier, and its process — without commercial terms (amounts, payments), so it can be
 * shown to business units.
 */
export interface ProcurementSummary {
  contractId: EntityId;
  /** The contract's reference (`SZL-0007`). */
  code: string;
  title: string;
  projectId: EntityId;
  /** The project's business unit (for filtering by unit). */
  businessUnitId: EntityId | null;
  vendorName: string;
  /** `contractStatuses` code. */
  contractStatus: string;
  /** Who manages the purchase on the organisation's side. */
  ownerId: PersonId | null;
  steps: ProcurementStep[];
  /** Notes the viewer may read. */
  noteCount: number;
  lastNoteAt: IsoDateTime | null;
}

export interface ProcurementProcess extends ProcurementSummary {
  /** Newest first; internal notes only for `procurement:edit`. */
  notes: ProcurementNote[];
}

export type ProcurementStepDraft = Draft<ProcurementStep>;

export interface ProcurementNoteInput {
  text: string;
  internal: boolean;
}
