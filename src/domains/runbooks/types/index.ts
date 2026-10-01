import type { ApplicationId } from '@/domains/applications/types';
import type {
  AuditMetadata,
  Draft,
  EntityId,
  IsoDate,
  PersonId,
  TeamId,
} from '@/domains/shared/types';

export type RunbookId = EntityId;

/** Seed address types; administrators can add more in master data (`runbookLinkTypes`). */
export const RUNBOOK_LINK_TYPES = [
  'monitoring',
  'logs',
  'health-check',
  'dashboard',
  'alerting',
  'status-page',
  'console',
  'documentation',
  'other',
] as const;

/** One instruction in an ordered list (first response, or a scenario's resolution). */
export interface RunbookStep {
  id: EntityId;
  text: string;
}

/** An address to check during an incident: a dashboard, log search, health endpoint… */
export interface RunbookLink {
  id: EntityId;
  /** `runbookLinkTypes` code. */
  type: string;
  label: string;
  url: string;
  /** What to look for there ("5xx oranı %1'i geçiyorsa…"). Never credentials. */
  note: string;
}

/**
 * Who to call, in escalation order: a person, a team, or just a channel (an on-call line).
 * Phone numbers and channels are contact data, not secrets; credentials never belong here.
 */
export interface RunbookContact {
  id: EntityId;
  /** Role in the escalation, e.g. "1. seviye — nöbetçi destek". */
  label: string;
  personId: PersonId | null;
  teamId: TeamId | null;
  /** How to reach them: on-call line, chat channel, bridge… */
  channel: string;
  /** When to call, e.g. "15 dakikada çözülmezse". */
  when: string;
}

/** A known problem: how it shows, and the steps that resolve it. */
export interface RunbookScenario {
  id: EntityId;
  title: string;
  symptoms: string;
  steps: RunbookStep[];
}

/**
 * The incident playbook of one application (a row of `application_runbooks` plus its child
 * tables): what to do first, where to look, whom to call, and fixes for known problems.
 */
export interface Runbook {
  id: RunbookId;
  applicationId: ApplicationId;
  /** When to use this runbook and what "healthy" looks like. */
  summary: string;
  firstResponse: RunbookStep[];
  links: RunbookLink[];
  contacts: RunbookContact[];
  scenarios: RunbookScenario[];
  /** Last time someone walked through the runbook and confirmed it still works. */
  lastVerifiedOn: IsoDate | null;
  audit: AuditMetadata;
}

export type RunbookScenarioDraft = Omit<Draft<RunbookScenario>, 'steps'> & {
  steps: Draft<RunbookStep>[];
};

export interface RunbookInput {
  applicationId: ApplicationId;
  summary: string;
  firstResponse: Draft<RunbookStep>[];
  links: Draft<RunbookLink>[];
  contacts: Draft<RunbookContact>[];
  scenarios: RunbookScenarioDraft[];
  lastVerifiedOn: IsoDate | null;
}
