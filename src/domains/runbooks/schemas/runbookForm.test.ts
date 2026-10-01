import { describe, expect, it } from 'vitest';
import {
  emptyRunbookContact,
  runbookFormSchema,
  textToSteps,
  toRunbookFormValues,
  toRunbookInput,
} from './runbookForm';

describe('runbook form', () => {
  it('turns lines into steps, dropping blank lines and typed numbering', () => {
    expect(textToSteps('1. Panoya bak\n\n- Logları kontrol et\n  3) Teknik sahibi ara  ')).toEqual([
      { id: null, text: 'Panoya bak' },
      { id: null, text: 'Logları kontrol et' },
      { id: null, text: 'Teknik sahibi ara' },
    ]);
  });

  it('requires a person, team or channel for each contact', () => {
    const values = {
      ...toRunbookFormValues(),
      contacts: [{ ...emptyRunbookContact(), label: 'Nöbetçi' }],
    };
    expect(runbookFormSchema.safeParse(values).success).toBe(false);
    const withChannel = {
      ...values,
      contacts: values.contacts.map((c) => ({ ...c, channel: 'Dahili 4410' })),
    };
    expect(runbookFormSchema.safeParse(withChannel).success).toBe(true);
  });

  it('refuses credentials in the text', () => {
    const values = { ...toRunbookFormValues(), firstResponse: 'Konsola gir: password=hunter2' };
    expect(runbookFormSchema.safeParse(values).success).toBe(false);
  });

  it('maps form values to a write request', () => {
    const input = toRunbookInput(12, {
      ...toRunbookFormValues(),
      lastVerifiedOn: '',
      firstResponse: 'Panoya bak',
      contacts: [{ ...emptyRunbookContact(), label: 'Sahip', personId: '8' }],
      scenarios: [
        {
          id: null,
          title: '429 artışı',
          symptoms: '',
          steps: 'Kotayı kontrol et\nSahibe haber ver',
        },
      ],
    });
    expect(input.applicationId).toBe(12);
    expect(input.lastVerifiedOn).toBeNull();
    expect(input.contacts[0]).toMatchObject({ personId: 8, teamId: null });
    expect(input.scenarios[0]?.steps).toHaveLength(2);
  });
});
