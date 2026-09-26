import { z } from 'zod';
import { relatedEntitiesSchema, requireRelated } from '@/domains/risks/schemas/riskForm';
import { enumChoice, optionalText, requiredDate, requiredText } from '@/lib/validation';
import { DECISION_STATUSES, type Decision, type DecisionInput } from '../types';

export const decisionFormSchema = z
  .object({
    title: requiredText('Title', 160),
    status: enumChoice(DECISION_STATUSES, 'a status'),
    decisionDate: requiredDate('Decision date'),
    context: requiredText('Context', 4000),
    decision: requiredText('Decision', 4000),
    rationale: optionalText('Rationale', 4000),
    alternatives: z.array(z.string().trim().min(1).max(300)),
    consequences: optionalText('Consequences', 4000),
    decidedByIds: z.array(z.string()).min(1, 'Add at least one decision maker.'),
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
    decidedByIds: decision?.decidedByIds ?? [],
    relatedApplicationIds: decision?.relatedApplicationIds ?? prefill.relatedApplicationIds,
    relatedProjectIds: decision?.relatedProjectIds ?? prefill.relatedProjectIds,
  };
}

export function toDecisionInput(values: DecisionFormValues): DecisionInput {
  return { ...values, title: values.title.trim() };
}
