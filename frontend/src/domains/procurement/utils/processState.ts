import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import type { IsoDate } from '@/domains/shared/types';
import { toIsoDate } from '@/lib/dates';
import { CLOSED_STEP_STATUSES, type ProcurementStep, type ProcurementSummary } from '../types';

/** Where a purchase stands, derived from its steps. */
export type ProcessState =
  'undefined' | 'not-started' | 'in-progress' | 'late' | 'blocked' | 'completed';

/** Fixed like the rule that computes it, so not master data. */
export const PROCESS_STATE_LABELS: Record<ProcessState, string> = {
  undefined: 'Süreç tanımlanmadı',
  'not-started': 'Başlamadı',
  'in-progress': 'Devam ediyor',
  late: 'Gecikmede',
  blocked: 'Engellendi',
  completed: 'Tamamlandı',
};

export const PROCESS_STATES = Object.keys(PROCESS_STATE_LABELS) as ProcessState[];

export const isClosedStep = (step: Pick<ProcurementStep, 'status'>) =>
  CLOSED_STEP_STATUSES.includes(step.status);

/** Still open after its planned end. */
export const isLateStep = (step: ProcurementStep, today: IsoDate) =>
  !isClosedStep(step) && step.plannedEnd !== null && step.plannedEnd < today;

const days = (from: IsoDate, to: IsoDate) => differenceInCalendarDays(parseISO(to), parseISO(from));

/**
 * Days behind plan: for a finished step, actual against planned end (negative = early); for an
 * open step past its planned end, the days since. `null` when there is nothing to compare.
 */
export function delayDays(step: ProcurementStep, today: IsoDate): number | null {
  if (!step.plannedEnd) return null;
  if (step.status === 'done' && step.actualEnd) return days(step.plannedEnd, step.actualEnd);
  if (isLateStep(step, today)) return days(step.plannedEnd, today);
  return null;
}

/** The first step that is neither done nor skipped. */
export const currentStep = (steps: readonly ProcurementStep[]) =>
  steps.find((step) => !isClosedStep(step)) ?? null;

export function progress(steps: readonly ProcurementStep[]) {
  return { closed: steps.filter(isClosedStep).length, total: steps.length };
}

export function processState(steps: readonly ProcurementStep[], today: IsoDate): ProcessState {
  if (steps.length === 0) return 'undefined';
  if (steps.every(isClosedStep)) return 'completed';
  if (steps.some((step) => step.status === 'blocked')) return 'blocked';
  if (steps.some((step) => isLateStep(step, today))) return 'late';
  const started = steps.some((step) => isClosedStep(step) || step.actualStart !== null);
  return started ? 'in-progress' : 'not-started';
}

/** A step due (or overdue) soon, for the dashboard's deadline list. */
export interface StepDeadline {
  purchase: ProcurementSummary;
  step: ProcurementStep;
  dueDate: IsoDate;
  late: boolean;
}

/** Open steps due within `withinDays` of today, overdue ones included, earliest first. */
export function upcomingDeadlines(
  purchases: readonly ProcurementSummary[],
  today: IsoDate,
  withinDays: number,
): StepDeadline[] {
  const horizon = toIsoDate(addDays(parseISO(today), withinDays));
  return purchases
    .flatMap((purchase) =>
      purchase.steps
        .filter((step) => !isClosedStep(step) && step.plannedEnd && step.plannedEnd <= horizon)
        .map((step) => ({
          purchase,
          step,
          dueDate: step.plannedEnd ?? today,
          late: isLateStep(step, today),
        })),
    )
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) || a.purchase.code.localeCompare(b.purchase.code),
    );
}

/** Headline numbers of the tracker. */
export function trackerMetrics(
  purchases: readonly ProcurementSummary[],
  today: IsoDate,
  withinDays: number,
) {
  const states = purchases.map((p) => processState(p.steps, today));
  const open = upcomingDeadlines(purchases, today, withinDays);
  return {
    running: states.filter((s) => ['not-started', 'in-progress', 'late', 'blocked'].includes(s))
      .length,
    lateSteps: open.filter((d) => d.late).length,
    dueSoon: open.filter((d) => !d.late).length,
    blocked: states.filter((s) => s === 'blocked').length,
    completed: states.filter((s) => s === 'completed').length,
    undefinedCount: states.filter((s) => s === 'undefined').length,
  };
}
