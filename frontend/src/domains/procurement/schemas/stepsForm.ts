import { z } from 'zod';
import type { SelectOption } from '@/components/forms/fields';
import {
  childRowId,
  idText,
  optionalDate,
  requiredChoice,
  secretFreeText,
  toIdOrNull,
} from '@/lib/validation';
import type { ProcurementStep, ProcurementStepDraft } from '../types';

const stepSchema = z
  .object({
    id: childRowId,
    type: requiredChoice('bir adım'),
    status: requiredChoice('bir durum'),
    ownerId: z.string(),
    plannedStart: optionalDate,
    plannedEnd: optionalDate,
    actualStart: optionalDate,
    actualEnd: optionalDate,
    note: secretFreeText('Not', 1000),
  })
  .superRefine((step, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message });
    if (step.plannedStart && step.plannedEnd && step.plannedEnd < step.plannedStart) {
      issue('plannedEnd', 'Planlanan bitiş başlangıçtan önce olamaz.');
    }
    if (step.actualStart && step.actualEnd && step.actualEnd < step.actualStart) {
      issue('actualEnd', 'Gerçekleşen bitiş başlangıçtan önce olamaz.');
    }
    if (step.status === 'done' && !step.actualEnd) {
      issue('actualEnd', 'Tamamlanan adımın bitiş tarihini girin.');
    }
    if (step.status === 'in-progress' && !step.actualStart) {
      issue('actualStart', 'Başlayan adımın başlangıç tarihini girin.');
    }
  });

/** The steps of one purchase, in order. Dates are optional except where the status needs them. */
export const stepsFormSchema = z.object({
  steps: z.array(stepSchema).max(30, 'En fazla 30 adım girilebilir.'),
});

export type StepsFormValues = z.infer<typeof stepsFormSchema>;
export type StepFormValues = StepsFormValues['steps'][number];

export const emptyStep = (type = ''): StepFormValues => ({
  id: null,
  type,
  status: 'not-started',
  ownerId: '',
  plannedStart: '',
  plannedEnd: '',
  actualStart: '',
  actualEnd: '',
  note: '',
});

/** A new process from the standard steps: the active `procurementSteps`, in list order. */
export const templateSteps = (stepTypes: readonly SelectOption[]): StepFormValues[] =>
  stepTypes.map((option) => emptyStep(option.value));

export const toStepsFormValues = (steps: readonly ProcurementStep[]): StepsFormValues => ({
  steps: steps.map((step) => ({
    id: step.id,
    type: step.type,
    status: step.status,
    ownerId: idText(step.ownerId),
    plannedStart: step.plannedStart ?? '',
    plannedEnd: step.plannedEnd ?? '',
    actualStart: step.actualStart ?? '',
    actualEnd: step.actualEnd ?? '',
    note: step.note,
  })),
});

const dateOrNull = (value: string) => (value === '' ? null : value);

export const toStepDrafts = (values: StepsFormValues): ProcurementStepDraft[] =>
  values.steps.map((step) => ({
    id: step.id,
    type: step.type,
    status: step.status,
    ownerId: toIdOrNull(step.ownerId),
    plannedStart: dateOrNull(step.plannedStart),
    plannedEnd: dateOrNull(step.plannedEnd),
    actualStart: dateOrNull(step.actualStart),
    actualEnd: dateOrNull(step.actualEnd),
    note: step.note.trim(),
  }));

export const noteFormSchema = z.object({
  text: secretFreeText('Not', 2000).refine((value) => value.trim() !== '', 'Notu yazın.'),
  internal: z.boolean(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
