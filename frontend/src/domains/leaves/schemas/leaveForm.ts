import { z } from 'zod';
import { idText, requiredChoice, requiredDate, secretFreeText, toId } from '@/lib/validation';
import type { LeaveInput, LeaveRecord } from '../types';

export const leaveFormSchema = z
  .object({
    personId: requiredChoice('bir kişi'),
    type: requiredChoice('bir izin türü'),
    startDate: requiredDate('Başlangıç tarihi'),
    endDate: requiredDate('Bitiş tarihi'),
    note: secretFreeText('Not', 200),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    message: 'Bitiş tarihi başlangıçtan önce olamaz.',
    path: ['endDate'],
  });

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;

/** Existing leave, or a new one pre-filled from a calendar click (person and first day). */
export function toLeaveFormValues(
  leave?: LeaveRecord,
  prefill: { personId?: number; date?: string } = {},
): LeaveFormValues {
  return {
    personId: idText(leave?.personId ?? prefill.personId),
    type: leave?.type ?? 'annual',
    startDate: leave?.startDate ?? prefill.date ?? '',
    endDate: leave?.endDate ?? prefill.date ?? '',
    note: leave?.note ?? '',
  };
}

export const toLeaveInput = (values: LeaveFormValues): LeaveInput => ({
  personId: toId(values.personId),
  type: values.type,
  startDate: values.startDate,
  endDate: values.endDate,
  note: values.note.trim(),
});
