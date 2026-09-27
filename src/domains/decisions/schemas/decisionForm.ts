import { z } from 'zod';
import { relatedEntitiesSchema, requireRelated } from '@/domains/risks/schemas/riskForm';
import { enumChoice, optionalText, requiredDate, requiredText, toId } from '@/lib/validation';
import { DECISION_STATUSES, type Decision, type DecisionInput } from '../types';

export const decisionFormSchema = z
  .object({
    title: requiredText('Başlık', 160),
    status: enumChoice(DECISION_STATUSES, 'bir durum'),
    decisionDate: requiredDate('Karar tarihi'),
    context: requiredText('Bağlam', 4000),
    decision: requiredText('Karar', 4000),
    rationale: optionalText('Gerekçe', 4000),
    alternatives: z.array(z.string().trim().min(1).max(300)),
    consequences: optionalText('Sonuçlar', 4000),
    decidedByIds: z.array(z.string()).min(1, 'En az bir karar verici ekleyin.'),
  })
  .and(relatedEntitiesSchema)
  .superRefine(requireRelated);

export type DecisionFormValues = z.infer<typeof decisionFormSchema>;

export function toDecisionFormValues(
  decision: Decision | undefined,
  prefill: z.infer<typeof relatedEntitiesSchema>,
  today: string,
): DecisionFormValues {
  return {
    title: decision?.title ?? '',
    status: decision?.status ?? 'proposed',
    decisionDate: decision?.decisionDate ?? today,
    context: decision?.context ?? '',
    decision: decision?.decision ?? '',
    rationale: decision?.rationale ?? '',
    alternatives: decision?.alternatives ?? [],
    consequences: decision?.consequences ?? '',
    decidedByIds: decision?.decidedByIds.map(String) ?? [],
    relatedApplicationIds:
      decision?.relatedApplicationIds.map(String) ?? prefill.relatedApplicationIds,
    relatedProjectIds: decision?.relatedProjectIds.map(String) ?? prefill.relatedProjectIds,
  };
}

export function toDecisionInput(values: DecisionFormValues): DecisionInput {
  return {
    ...values,
    title: values.title.trim(),
    decidedByIds: values.decidedByIds.map(toId),
    relatedApplicationIds: values.relatedApplicationIds.map(toId),
    relatedProjectIds: values.relatedProjectIds.map(toId),
  };
}
