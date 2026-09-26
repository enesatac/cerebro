import { describe, expect, it } from 'vitest';
import {
  integrationFormSchema,
  toIntegrationFormValues,
  toIntegrationInput,
} from './connectionForms';

describe('integration form', () => {
  const base = {
    ...toIntegrationFormValues(undefined, 'app-order-management'),
    name: 'Orders API',
  };

  it('requires a receiving application or an external party', () => {
    expect(integrationFormSchema.safeParse(base).success).toBe(false);
    expect(
      integrationFormSchema.safeParse({ ...base, toApplicationId: 'app-payment-gateway' }).success,
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
      toApplicationId: 'app-payment-gateway',
      externalPartyName: 'Bank',
    });
    expect(input.toApplicationId).toBeNull();
    expect(input.externalPartyName).toBe('Bank');
  });

  it('refuses credentials in descriptions', () => {
    const result = integrationFormSchema.safeParse({
      ...base,
      toApplicationId: 'app-payment-gateway',
      description: 'client_secret=xyz',
    });
    expect(result.success).toBe(false);
  });
});
