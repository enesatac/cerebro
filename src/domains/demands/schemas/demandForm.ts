import { z } from 'zod';
import {
  emptyToNull,
  idText,
  looksLikeSecret,
  NO_SECRETS_MESSAGE,
  optionalDate,
  optionalWholeNumber,
  requiredChoice,
  requiredText,
  secretFreeText,
  toId,
  toIdOrNull,
  toNumberOrNull,
} from '@/lib/validation';
import type { PersonId } from '@/domains/shared/types';
import type { Demand, DemandInput } from '../types';

const requiredLongText = (label: string, max = 4000) =>
  requiredText(label, max).refine((value) => !looksLikeSecret(value), NO_SECRETS_MESSAGE);

export const demandFormSchema = z
  .object({
    title: requiredText('Başlık'),
    type: requiredChoice('bir talep türü'),
    businessUnitId: requiredChoice('bir iş birimi'),
    requesterId: requiredChoice('talep eden kişiyi'),
    sponsorId: z.string(),
    problem: requiredLongText('Mevcut durum ve ihtiyaç'),
    proposedSolution: secretFreeText('Beklenen çözüm ve kapsam', 4000),
    expectedBenefits: requiredLongText('Beklenen fayda'),
    benefitTypes: z.array(z.string()),
    urgency: requiredChoice('aciliyeti'),
    desiredDate: optionalDate,
    deadlineReason: secretFreeText('Tarih gerekçesi', 500),
    regulatory: z.boolean(),
    affectedUsers: optionalWholeNumber('Etkilenen kullanıcı sayısı'),
    estimatedBudget: optionalWholeNumber('Tahmini bütçe'),
    currency: requiredChoice('bir para birimi'),
    relatedApplicationIds: z.array(z.string()),
  })
  .refine((values) => !values.regulatory || values.deadlineReason.trim() !== '', {
    message: 'Yasal zorunluluk için mevzuatı veya son tarihin nedenini yazın.',
    path: ['deadlineReason'],
  });

export type DemandFormValues = z.infer<typeof demandFormSchema>;

const numberText = (value: number | null) => (value === null ? '' : String(value));

/**
 * Existing demand, or a new one for the signed-in person in their business unit — most demands
 * are raised by the person who needs the change.
 */
export function toDemandFormValues(
  demand?: Demand,
  me: { personId?: PersonId | null; businessUnitId?: number | null } = {},
): DemandFormValues {
  return {
    title: demand?.title ?? '',
    type: demand?.type ?? '',
    businessUnitId: idText(demand?.businessUnitId ?? me.businessUnitId),
    requesterId: idText(demand?.requesterId ?? me.personId),
    sponsorId: idText(demand?.sponsorId),
    problem: demand?.problem ?? '',
    proposedSolution: demand?.proposedSolution ?? '',
    expectedBenefits: demand?.expectedBenefits ?? '',
    benefitTypes: demand?.benefitTypes ?? [],
    urgency: demand?.urgency ?? 'medium',
    desiredDate: demand?.desiredDate ?? '',
    deadlineReason: demand?.deadlineReason ?? '',
    regulatory: demand?.regulatory ?? false,
    affectedUsers: numberText(demand?.affectedUsers ?? null),
    estimatedBudget: numberText(demand?.estimatedBudget ?? null),
    currency: demand?.currency ?? 'TRY',
    relatedApplicationIds: (demand?.relatedApplicationIds ?? []).map(String),
  };
}

export const toDemandInput = (values: DemandFormValues): DemandInput => ({
  title: values.title.trim(),
  type: values.type,
  businessUnitId: toId(values.businessUnitId),
  requesterId: toId(values.requesterId),
  sponsorId: toIdOrNull(values.sponsorId),
  problem: values.problem.trim(),
  proposedSolution: values.proposedSolution.trim(),
  expectedBenefits: values.expectedBenefits.trim(),
  benefitTypes: values.benefitTypes,
  urgency: values.urgency,
  desiredDate: emptyToNull(values.desiredDate),
  deadlineReason: values.deadlineReason.trim(),
  regulatory: values.regulatory,
  affectedUsers: toNumberOrNull(values.affectedUsers),
  estimatedBudget: toNumberOrNull(values.estimatedBudget),
  currency: values.currency,
  relatedApplicationIds: values.relatedApplicationIds.map(toId),
});
