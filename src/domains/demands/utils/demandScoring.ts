import type { Demand, DemandAssessment, DemandPriority } from '../types';
import { CLOSED_STATUSES } from '../types';

/** The four "cost of delay" criteria, in the order the assessment form shows them. */
export const VALUE_CRITERIA = [
  {
    key: 'businessValue',
    label: 'İş değeri',
    hint: 'Gelir, tasarruf veya müşteri deneyimine katkı.',
  },
  {
    key: 'strategicFit',
    label: 'Stratejik uyum',
    hint: 'Şirket hedefleri ve yol haritasıyla örtüşme.',
  },
  {
    key: 'timeCriticality',
    label: 'Zaman kritikliği',
    hint: 'Beklemenin maliyeti; yasal veya sözleşmesel bir tarih var mı?',
  },
  {
    key: 'riskReduction',
    label: 'Risk azaltma',
    hint: 'Güvenlik, uyum veya operasyonel riski ne kadar azaltır.',
  },
] as const satisfies readonly { key: keyof DemandAssessment; label: string; hint: string }[];

export const EFFORT_CRITERION = {
  key: 'effort',
  label: 'Efor',
  hint: '1 = tek ekip, birkaç hafta · 5 = birden çok ekip, bir yıl veya daha uzun.',
} as const;

type Scores = Pick<
  DemandAssessment,
  'businessValue' | 'strategicFit' | 'timeCriticality' | 'riskReduction' | 'effort'
>;

/**
 * WSJF: cost of delay (the sum of the four criteria, 4–20) divided by effort (1–5), one decimal.
 * `null` until every criterion is scored. Higher means "do it sooner".
 */
export function priorityScore(scores: Scores): number | null {
  const { businessValue, strategicFit, timeCriticality, riskReduction, effort } = scores;
  if (!businessValue || !strategicFit || !timeCriticality || !riskReduction || !effort) {
    return null;
  }
  const costOfDelay = businessValue + strategicFit + timeCriticality + riskReduction;
  return Math.round((costOfDelay / effort) * 10) / 10;
}

/** Thresholds behind the suggested priority; documented next to the score in the UI. */
export const PRIORITY_THRESHOLDS: readonly { min: number; priority: DemandPriority }[] = [
  { min: 8, priority: 'p1' },
  { min: 5, priority: 'p2' },
  { min: 3, priority: 'p3' },
  { min: 0, priority: 'p4' },
];

/** The priority the score points to; the portfolio office may decide otherwise. */
export function suggestedPriority(score: number | null): DemandPriority | null {
  if (score === null) return null;
  return PRIORITY_THRESHOLDS.find((t) => score >= t.min)?.priority ?? 'p4';
}

export const isOpenDemand = (demand: Pick<Demand, 'status'>) =>
  !CLOSED_STATUSES.includes(demand.status);

const PRIORITY_ORDER = ['p1', 'p2', 'p3', 'p4'];
const priorityRank = (priority: DemandPriority | null) => {
  const index = priority ? PRIORITY_ORDER.indexOf(priority) : -1;
  return index === -1 ? PRIORITY_ORDER.length : index;
};

/**
 * Backlog order: decided priority first, then the score, then regulatory demands, then the
 * oldest submission (first come, first served on a tie).
 */
export function compareBacklog(a: Demand, b: Demand): number {
  return (
    priorityRank(a.assessment.priority) - priorityRank(b.assessment.priority) ||
    (priorityScore(b.assessment) ?? -1) - (priorityScore(a.assessment) ?? -1) ||
    Number(b.regulatory) - Number(a.regulatory) ||
    a.submittedAt.localeCompare(b.submittedAt)
  );
}
