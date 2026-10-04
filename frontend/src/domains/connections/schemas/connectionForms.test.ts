import { describe, expect, it } from 'vitest';
import {
  integrationFormSchema,
  toIntegrationFormValues,
  toIntegrationInput,
} from './connectionForms';
import { APP } from '@/services/mock/data/ids';

describe('integration form', () => {
  const base = {
    ...toIntegrationFormValues(undefined, String(APP.orderManagement)),
    name: 'Orders API',
  };

  it('requires a receiving application or an external party', () => {
    expect(integrationFormSchema.safeParse(base).success).toBe(false);
    expect(
      integrationFormSchema.safeParse({ ...base, toApplicationId: String(APP.paymentGateway) })
        .success,
    ).toBe(true);
    expect(
      integrationFormSchema.safeParse({
        ...base,
        targetKind: 'external',
        externalPartyName: 'Bank',
      }).success,
    ).toBe(true);
  });

  it('clears the unused endpoint on save', () => {
    const input = toIntegrationInput({
      ...base,
      targetKind: 'external',
      toApplicationId: String(APP.paymentGateway),
      externalPartyName: 'Bank',
    });
    expect(input.toApplicationId).toBeNull();
    expect(input.externalPartyName).toBe('Bank');
  });

  it('refuses credentials in descriptions', () => {
    const result = integrationFormSchema.safeParse({
      ...base,
      toApplicationId: String(APP.paymentGateway),
      description: 'client_secret=xyz',
    });
    expect(result.success).toBe(false);
  });
});
