import { z } from 'zod';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  emptyToNull,
  enumChoice,
  optionalDate,
  optionalText,
  requiredText,
} from '@/lib/validation';
import {
  RISK_CATEGORIES,
  RISK_LIKELIHOODS,
  RISK_STATUSES,
  type Risk,
  type RiskInput,
} from '../types';

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
      message: 'Link at least one application or project.',
      path: ['relatedApplicationIds'],
    });
  }
};

export const riskFormSchema = z
  .object({
    title: requiredText('Title', 160),
    description: optionalText('Description', 2000),
    category: enumChoice(RISK_CATEGORIES, 'a category'),
    probability: enumChoice(RISK_LIKELIHOODS, 'a probability'),
    impact: enumChoice(RISK_LIKELIHOODS, 'an impact'),
    severity: enumChoice(CRITICALITIES, 'a severity'),
    status: enumChoice(RISK_STATUSES, 'a status'),
    ownerId: z.string(),
    mitigationPlan: optionalText('Mitigation plan', 2000),
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
    ownerId: risk?.ownerId ?? '',
    mitigationPlan: risk?.mitigationPlan ?? '',
    dueDate: risk?.dueDate ?? '',
    relatedApplicationIds: risk?.relatedApplicationIds ?? prefill.relatedApplicationIds,
    relatedProjectIds: risk?.relatedProjectIds ?? prefill.relatedProjectIds,
  };
}

export function toRiskInput(values: RiskFormValues): RiskInput {
  return {
    ...values,
    title: values.title.trim(),
    ownerId: emptyToNull(values.ownerId),
    dueDate: emptyToNull(values.dueDate),
  };
}
