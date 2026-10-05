import { z } from 'zod';
import type { EntityId, IsoDate } from '@/domains/shared/types';
import {
  idText,
  looksLikeSecret,
  NO_SECRETS_MESSAGE,
  requiredChoice,
  requiredDate,
  requiredText,
  secretFreeText,
  toId,
  toIdOrNull,
} from '@/lib/validation';
import type { Release, ReleaseInput } from '../types';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const time = z
  .string()
  .trim()
  .refine((value) => value === '' || TIME.test(value), 'Saati SS:DD biçiminde girin.');

export const releaseFormSchema = z
  .object({
    releaseNumber: requiredText('Geçiş numarası', 40).refine(
      (value) => !looksLikeSecret(value),
      NO_SECRETS_MESSAGE,
    ),
    title: requiredText('Başlık'),
    applicationId: requiredChoice('bir uygulama'),
    projectId: z.string(),
    type: requiredChoice('bir geçiş türü'),
    status: requiredChoice('bir durum'),
    plannedDate: requiredDate('Geçiş tarihi'),
    startTime: time,
    endTime: time,
    version: secretFreeText('Sürüm', 40),
    ownerId: z.string(),
    serviceInterruption: z.boolean(),
    description: secretFreeText('Geçiş detayları', 4000),
    rollbackPlan: secretFreeText('Geri alma planı', 2000),
    outcomeNote: secretFreeText('Sonuç notu', 2000),
  })
  .superRefine((values, context) => {
    if (values.endTime && !values.startTime) {
      context.addIssue({
        code: 'custom',
        path: ['startTime'],
        message: 'Bitiş saati için başlangıç saatini de girin.',
      });
    }
  });

export type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

export interface ReleasePrefill {
  applicationId?: EntityId | null;
  projectId?: EntityId | null;
  date?: IsoDate | null;
}

export function toReleaseFormValues(
  release: Release | undefined,
  prefill: ReleasePrefill = {},
): ReleaseFormValues {
  return {
    releaseNumber: release?.releaseNumber ?? '',
    title: release?.title ?? '',
    applicationId: idText(release?.applicationId ?? prefill.applicationId),
    projectId: idText(release?.projectId ?? prefill.projectId),
    type: release?.type ?? '',
    status: release?.status ?? 'planned',
    plannedDate: release?.plannedDate ?? prefill.date ?? '',
    startTime: release?.startTime ?? '',
    endTime: release?.endTime ?? '',
    version: release?.version ?? '',
    ownerId: idText(release?.ownerId),
    serviceInterruption: release?.serviceInterruption ?? false,
    description: release?.description ?? '',
    rollbackPlan: release?.rollbackPlan ?? '',
    outcomeNote: release?.outcomeNote ?? '',
  };
}

export const toReleaseInput = (values: ReleaseFormValues): ReleaseInput => ({
  releaseNumber: values.releaseNumber.trim(),
  title: values.title.trim(),
  applicationId: toId(values.applicationId),
  projectId: toIdOrNull(values.projectId),
  type: values.type,
  status: values.status,
  plannedDate: values.plannedDate,
  startTime: values.startTime.trim(),
  endTime: values.endTime.trim(),
  version: values.version.trim(),
  ownerId: toIdOrNull(values.ownerId),
  serviceInterruption: values.serviceInterruption,
  description: values.description.trim(),
  rollbackPlan: values.rollbackPlan.trim(),
  outcomeNote: values.outcomeNote.trim(),
});
