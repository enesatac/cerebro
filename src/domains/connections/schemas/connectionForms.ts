import { z } from 'zod';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  enumChoice,
  optionalText,
  requiredChoice,
  requiredText,
  secretFreeText,
} from '@/lib/validation';
import {
  DEPENDENCY_TYPES,
  INTEGRATION_FREQUENCIES,
  INTEGRATION_TYPES,
  type ApplicationDependency,
  type DependencyInput,
  type Integration,
  type IntegrationInput,
} from '../types';

export const dependencyFormSchema = z
  .object({
    sourceApplicationId: requiredChoice('the dependent application'),
    targetApplicationId: requiredChoice('the application it depends on'),
    type: enumChoice(DEPENDENCY_TYPES, 'a type'),
    criticality: enumChoice(CRITICALITIES, 'an impact level'),
    description: optionalText('Description', 500),
  })
  .refine((values) => values.sourceApplicationId !== values.targetApplicationId, {
    message: 'An application cannot depend on itself.',
    path: ['targetApplicationId'],
  });

export type DependencyFormValues = z.infer<typeof dependencyFormSchema>;

export function toDependencyFormValues(
  dependency?: ApplicationDependency,
  sourceId = '',
): DependencyFormValues {
  return {
    sourceApplicationId: dependency?.sourceApplicationId ?? sourceId,
    targetApplicationId: dependency?.targetApplicationId ?? '',
    type: dependency?.type ?? 'runtime',
    criticality: dependency?.criticality ?? 'medium',
    description: dependency?.description ?? '',
  };
}

export const toDependencyInput = (values: DependencyFormValues): DependencyInput => ({
  ...values,
  description: values.description.trim(),
});

export const INTEGRATION_TARGET_KINDS = ['application', 'external'] as const;

export const integrationFormSchema = z
  .object({
    name: requiredText('Name', 120),
    type: enumChoice(INTEGRATION_TYPES, 'a type'),
    frequency: enumChoice(INTEGRATION_FREQUENCIES, 'a frequency'),
    fromApplicationId: requiredChoice('the initiating application'),
    targetKind: z.enum(INTEGRATION_TARGET_KINDS),
    toApplicationId: z.string(),
    externalPartyName: optionalText('External party', 120),
    dataExchanged: secretFreeText('Data exchanged', 300),
    description: secretFreeText('Description', 1000),
  })
  .superRefine((values, ctx) => {
    if (values.targetKind === 'application' && !values.toApplicationId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select the receiving application.',
        path: ['toApplicationId'],
      });
    }
    if (
      values.targetKind === 'application' &&
      values.toApplicationId === values.fromApplicationId
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'An integration needs two different applications.',
        path: ['toApplicationId'],
      });
    }
    if (values.targetKind === 'external' && !values.externalPartyName.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Name the external party.',
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
    fromApplicationId: integration?.fromApplicationId ?? fromId,
    targetKind: integration && integration.toApplicationId === null ? 'external' : 'application',
    toApplicationId: integration?.toApplicationId ?? '',
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
    fromApplicationId: values.fromApplicationId,
    toApplicationId: toApplication ? values.toApplicationId : null,
    externalPartyName: toApplication ? null : values.externalPartyName.trim(),
    dataExchanged: values.dataExchanged.trim(),
    description: values.description.trim(),
  };
}
