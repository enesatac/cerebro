import { z } from 'zod';
import type { PersonId } from '@/domains/shared/types';
import {
  emptyToNull,
  idText,
  optionalDate,
  requiredChoice,
  secretFreeText,
  toIdOrNull,
} from '@/lib/validation';
import type { Demand, DemandAssessmentInput, DemandScore, DemandStatus } from '../types';

const score = z.string().regex(/^[1-5]?$/, 'Puan 1 ile 5 arasında olmalıdır.');

/** Mirrors the repository's status rules so the dialog explains them before saving. */
export const assessmentFormSchema = z
  .object({
    status: requiredChoice('bir durum'),
    priority: z.string(),
    assessorId: z.string(),
    businessValue: score,
    strategicFit: score,
    timeCriticality: score,
    riskReduction: score,
    effort: score,
    plannedStart: optionalDate,
    plannedEnd: optionalDate,
    projectId: z.string(),
    decisionNote: secretFreeText('Karar notu', 2000),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message });
    const { status } = values;
    if (status === 'rejected' && !values.decisionNote.trim()) {
      issue('decisionNote', 'Reddetmek için gerekçeyi yazın; talep sahibi bu notu görür.');
    }
    if (status === 'needs-info' && !values.decisionNote.trim()) {
      issue('decisionNote', 'Talep sahibinden hangi bilgiyi beklediğinizi yazın.');
    }
    if (['approved', 'scheduled', 'converted'].includes(status) && !values.priority) {
      issue('priority', 'Onaylanan talebin önceliğini belirleyin.');
    }
    if (['scheduled', 'converted'].includes(status)) {
      if (!values.plannedStart) issue('plannedStart', 'Takvime almak için başlangıcı girin.');
      if (!values.plannedEnd) issue('plannedEnd', 'Takvime almak için bitişi girin.');
    }
    if (values.plannedStart && values.plannedEnd && values.plannedEnd < values.plannedStart) {
      issue('plannedEnd', 'Bitiş başlangıçtan önce olamaz.');
    }
    if (status === 'converted' && !values.projectId) {
      issue('projectId', 'Talebin dönüştüğü projeyi seçin.');
    }
  });

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

const scoreText = (value: DemandScore | null) => (value === null ? '' : String(value));
const toScore = (value: string) => (value === '' ? null : (Number(value) as DemandScore));

/**
 * The demand's assessment as form values. A new submission moves to "in review" as soon as
 * someone opens it, and the person opening it becomes the assessor unless one is set.
 */
export function toAssessmentFormValues(
  demand: Demand,
  { status, assessorId }: { status?: DemandStatus; assessorId?: PersonId | null } = {},
): AssessmentFormValues {
  const a = demand.assessment;
  return {
    status: status ?? (demand.status === 'submitted' ? 'in-review' : demand.status),
    priority: a.priority ?? '',
    assessorId: idText(a.assessorId ?? assessorId),
    businessValue: scoreText(a.businessValue),
    strategicFit: scoreText(a.strategicFit),
    timeCriticality: scoreText(a.timeCriticality),
    riskReduction: scoreText(a.riskReduction),
    effort: scoreText(a.effort),
    plannedStart: a.plannedStart ?? '',
    plannedEnd: a.plannedEnd ?? '',
    projectId: idText(a.projectId),
    decisionNote: a.decisionNote,
  };
}

export const toAssessmentInput = (values: AssessmentFormValues): DemandAssessmentInput => ({
  status: values.status,
  priority: emptyToNull(values.priority),
  assessorId: toIdOrNull(values.assessorId),
  businessValue: toScore(values.businessValue),
  strategicFit: toScore(values.strategicFit),
  timeCriticality: toScore(values.timeCriticality),
  riskReduction: toScore(values.riskReduction),
  effort: toScore(values.effort),
  plannedStart: emptyToNull(values.plannedStart),
  plannedEnd: emptyToNull(values.plannedEnd),
  projectId: toIdOrNull(values.projectId),
  decisionNote: values.decisionNote.trim(),
});
