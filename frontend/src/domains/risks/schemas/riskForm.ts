import { z } from 'zod';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  emptyToNull,
  enumChoice,
  idText,
  optionalDate,
  optionalText,
  requiredChoice,
  requiredText,
  toId,
  toIdOrNull,
} from '@/lib/validation';
import { RISK_LIKELIHOODS, RISK_STATUSES, type Risk, type RiskInput } from '../types';

/** At least one application or project — an unlinked record is invisible where people look. */
export const relatedEntitiesSchema = z.object({
  relatedApplicationIds: z.array(z.string()),
  relatedProjectIds: z.array(z.string()),
});

export const requireRelated = (
  values: z.infer<typeof relatedEntitiesSchema>,
  ctx: z.RefinementCtx,
) => {
  if (values.relatedApplicationIds.length + values.relatedProjectIds.length === 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'En az bir uygulama veya proje bağlayın.',
      path: ['relatedApplicationIds'],
    });
  }
};

export const riskFormSchema = z
  .object({
    title: requiredText('Başlık', 160),
    description: optionalText('Açıklama', 2000),
    category: requiredChoice('bir kategori'),
    probability: enumChoice(RISK_LIKELIHOODS, 'bir olasılık'),
    impact: enumChoice(RISK_LIKELIHOODS, 'bir etki'),
    severity: enumChoice(CRITICALITIES, 'bir önem derecesi'),
    status: enumChoice(RISK_STATUSES, 'bir durum'),
    ownerId: z.string(),
    mitigationPlan: optionalText('Azaltma planı', 2000),
    dueDate: optionalDate,
  })
  .and(relatedEntitiesSchema)
  .superRefine(requireRelated);

export type RiskFormValues = z.infer<typeof riskFormSchema>;

export function toRiskFormValues(
  risk: Risk | undefined,
  prefill: z.infer<typeof relatedEntitiesSchema>,
): RiskFormValues {
  return {
    title: risk?.title ?? '',
    description: risk?.description ?? '',
    category: risk?.category ?? 'technical',
    probability: risk?.probability ?? 'medium',
    impact: risk?.impact ?? 'medium',
    severity: risk?.severity ?? 'medium',
    status: risk?.status ?? 'open',
    ownerId: idText(risk?.ownerId),
    mitigationPlan: risk?.mitigationPlan ?? '',
    dueDate: risk?.dueDate ?? '',
    relatedApplicationIds: risk?.relatedApplicationIds.map(String) ?? prefill.relatedApplicationIds,
    relatedProjectIds: risk?.relatedProjectIds.map(String) ?? prefill.relatedProjectIds,
  };
}

export function toRiskInput(values: RiskFormValues): RiskInput {
  return {
    ...values,
    title: values.title.trim(),
    ownerId: toIdOrNull(values.ownerId),
    relatedApplicationIds: values.relatedApplicationIds.map(toId),
    relatedProjectIds: values.relatedProjectIds.map(toId),
    dueDate: emptyToNull(values.dueDate),
  };
}
