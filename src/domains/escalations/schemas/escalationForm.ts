import { z } from 'zod';
import { relatedEntitiesSchema, requireRelated } from '@/domains/risks/schemas/riskForm';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  emptyToNull,
  enumChoice,
  idText,
  optionalDate,
  optionalText,
  requiredChoice,
  requiredDate,
  requiredText,
  toId,
  toIdOrNull,
} from '@/lib/validation';
import { ESCALATION_STATUSES, type Escalation, type EscalationInput } from '../types';

export const escalationFormSchema = z
  .object({
    title: requiredText('Başlık', 160),
    description: optionalText('Açıklama', 2000),
    severity: enumChoice(CRITICALITIES, 'bir önem derecesi'),
    status: enumChoice(ESCALATION_STATUSES, 'bir durum'),
    ownerId: z.string(),
    responsibleTeamId: z.string(),
    raisedById: requiredChoice('kaydı açan kişiyi'),
    raisedAt: requiredDate('Açılış tarihi'),
    targetResolutionDate: optionalDate,
    resolution: optionalText('Çözüm', 2000),
  })
  .and(relatedEntitiesSchema)
  .superRefine(requireRelated)
  .superRefine((values, ctx) => {
    if (
      (values.status === 'resolved' || values.status === 'closed') &&
      values.resolution.trim() === ''
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Çözmeden veya kapatmadan önce çözümü açıklayın.',
        path: ['resolution'],
      });
    }
  });

export type EscalationFormValues = z.infer<typeof escalationFormSchema>;

export function toEscalationFormValues(
  escalation: Escalation | undefined,
  prefill: z.infer<typeof relatedEntitiesSchema>,
  today: string,
): EscalationFormValues {
  return {
    title: escalation?.title ?? '',
    description: escalation?.description ?? '',
    severity: escalation?.severity ?? 'high',
    status: escalation?.status ?? 'open',
    ownerId: idText(escalation?.ownerId),
    responsibleTeamId: idText(escalation?.responsibleTeamId),
    raisedById: idText(escalation?.raisedById),
    raisedAt: escalation?.raisedAt.slice(0, 10) ?? today,
    targetResolutionDate: escalation?.targetResolutionDate ?? '',
    resolution: escalation?.resolution ?? '',
    relatedApplicationIds:
      escalation?.relatedApplicationIds.map(String) ?? prefill.relatedApplicationIds,
    relatedProjectIds: escalation?.relatedProjectIds.map(String) ?? prefill.relatedProjectIds,
  };
}

export function toEscalationInput(values: EscalationFormValues): EscalationInput {
  return {
    ...values,
    title: values.title.trim(),
    ownerId: toIdOrNull(values.ownerId),
    responsibleTeamId: toIdOrNull(values.responsibleTeamId),
    raisedById: toId(values.raisedById),
    relatedApplicationIds: values.relatedApplicationIds.map(toId),
    relatedProjectIds: values.relatedProjectIds.map(toId),
    raisedAt: `${values.raisedAt}T09:00:00Z`,
    targetResolutionDate: emptyToNull(values.targetResolutionDate),
    resolution: emptyToNull(values.resolution),
  };
}
