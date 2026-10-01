import { z } from 'zod';
import { idText, requiredChoice, requiredDate, secretFreeText, toId } from '@/lib/validation';
import { ALLOCATION_PERCENT, type Allocation, type AllocationInput } from '../types';

/** Percent choices offered in the form: 5 %, 10 % … 100 %. */
export const PERCENT_CHOICES = Array.from(
  { length: (ALLOCATION_PERCENT.max - ALLOCATION_PERCENT.min) / ALLOCATION_PERCENT.step + 1 },
  (_, index) => ALLOCATION_PERCENT.min + index * ALLOCATION_PERCENT.step,
);

export const allocationFormSchema = z
  .object({
    personId: requiredChoice('bir kişi'),
    projectId: requiredChoice('bir proje'),
    role: requiredChoice('bir rol'),
    startDate: requiredDate('Başlangıç tarihi'),
    endDate: requiredDate('Bitiş tarihi'),
    percent: requiredChoice('bir doluluk oranı'),
    note: secretFreeText('Not', 200),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    message: 'Bitiş tarihi başlangıçtan önce olamaz.',
    path: ['endDate'],
  });

export type AllocationFormValues = z.infer<typeof allocationFormSchema>;

export interface AllocationPrefill {
  personId?: number;
  projectId?: number;
  date?: string;
}

/** Existing allocation, or a new one pre-filled from the planner (person, project, first day). */
export function toAllocationFormValues(
  allocation?: Allocation,
  prefill: AllocationPrefill = {},
): AllocationFormValues {
  return {
    personId: idText(allocation?.personId ?? prefill.personId),
    projectId: idText(allocation?.projectId ?? prefill.projectId),
    role: allocation?.role ?? 'developer',
    startDate: allocation?.startDate ?? prefill.date ?? '',
    endDate: allocation?.endDate ?? '',
    percent: String(allocation?.percent ?? 50),
    note: allocation?.note ?? '',
  };
}

export const toAllocationInput = (values: AllocationFormValues): AllocationInput => ({
  personId: toId(values.personId),
  projectId: toId(values.projectId),
  role: values.role,
  startDate: values.startDate,
  endDate: values.endDate,
  percent: Number(values.percent),
  note: values.note.trim(),
});
