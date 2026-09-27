import { z } from 'zod';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  enumChoice,
  idText,
  optionalText,
  requiredChoice,
  requiredText,
  secretFreeText,
  toId,
} from '@/lib/validation';
import {
  type ApplicationDependency,
  type DependencyInput,
  type Integration,
  type IntegrationInput,
} from '../types';

export const dependencyFormSchema = z
  .object({
    sourceApplicationId: requiredChoice('bağımlı uygulamayı'),
    targetApplicationId: requiredChoice('bağımlı olunan uygulamayı'),
    type: requiredChoice('bir tür'),
    criticality: enumChoice(CRITICALITIES, 'bir etki düzeyi'),
    description: optionalText('Açıklama', 500),
  })
  .refine((values) => values.sourceApplicationId !== values.targetApplicationId, {
    message: 'Bir uygulama kendisine bağımlı olamaz.',
    path: ['targetApplicationId'],
  });

export type DependencyFormValues = z.infer<typeof dependencyFormSchema>;

export function toDependencyFormValues(
  dependency?: ApplicationDependency,
  sourceId = '',
): DependencyFormValues {
  return {
    sourceApplicationId: dependency ? idText(dependency.sourceApplicationId) : sourceId,
    targetApplicationId: idText(dependency?.targetApplicationId),
    type: dependency?.type ?? 'runtime',
    criticality: dependency?.criticality ?? 'medium',
    description: dependency?.description ?? '',
  };
}

export const toDependencyInput = (values: DependencyFormValues): DependencyInput => ({
  ...values,
  sourceApplicationId: toId(values.sourceApplicationId),
  targetApplicationId: toId(values.targetApplicationId),
  description: values.description.trim(),
});

export const INTEGRATION_TARGET_KINDS = ['application', 'external'] as const;

export const integrationFormSchema = z
  .object({
    name: requiredText('Ad', 120),
    type: requiredChoice('bir tür'),
    frequency: requiredChoice('bir sıklık'),
    fromApplicationId: requiredChoice('başlatan uygulamayı'),
    targetKind: z.enum(INTEGRATION_TARGET_KINDS),
    toApplicationId: z.string(),
    externalPartyName: optionalText('Harici taraf', 120),
    dataExchanged: secretFreeText('Aktarılan veri', 300),
    description: secretFreeText('Açıklama', 1000),
  })
  .superRefine((values, ctx) => {
    if (values.targetKind === 'application' && !values.toApplicationId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Alıcı uygulamayı seçin.',
        path: ['toApplicationId'],
      });
    }
    if (
      values.targetKind === 'application' &&
      values.toApplicationId === values.fromApplicationId
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Bir entegrasyon iki farklı uygulama gerektirir.',
        path: ['toApplicationId'],
      });
    }
    if (values.targetKind === 'external' && !values.externalPartyName.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Harici tarafın adını girin.',
        path: ['externalPartyName'],
      });
    }
  });

export type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

export function toIntegrationFormValues(
  integration?: Integration,
  fromId = '',
): IntegrationFormValues {
  return {
    name: integration?.name ?? '',
    type: integration?.type ?? 'rest-api',
    frequency: integration?.frequency ?? 'real-time',
    fromApplicationId: integration ? idText(integration.fromApplicationId) : fromId,
    targetKind: integration && integration.toApplicationId === null ? 'external' : 'application',
    toApplicationId: idText(integration?.toApplicationId),
    externalPartyName: integration?.externalPartyName ?? '',
    dataExchanged: integration?.dataExchanged ?? '',
    description: integration?.description ?? '',
  };
}

export function toIntegrationInput(values: IntegrationFormValues): IntegrationInput {
  const toApplication = values.targetKind === 'application';
  return {
    name: values.name.trim(),
    type: values.type,
    frequency: values.frequency,
    fromApplicationId: toId(values.fromApplicationId),
    toApplicationId: toApplication ? toId(values.toApplicationId) : null,
    externalPartyName: toApplication ? null : values.externalPartyName.trim(),
    dataExchanged: values.dataExchanged.trim(),
    description: values.description.trim(),
  };
}
