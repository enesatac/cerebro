import { describe, expect, it } from 'vitest';
import {
  emptyStep,
  noteFormSchema,
  stepsFormSchema,
  templateSteps,
  toStepDrafts,
} from './stepsForm';

const messages = (input: unknown) => {
  const result = stepsFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('procurement steps form', () => {
  it('builds a process from the standard steps', () => {
    const steps = templateSteps([
      { value: 'need-definition', label: 'İhtiyaç tanımı' },
      { value: 'rfq', label: 'Teklif talebi' },
    ]);
    expect(steps.map((s) => [s.type, s.status, s.id])).toEqual([
      ['need-definition', 'not-started', null],
      ['rfq', 'not-started', null],
    ]);
  });

  it('checks the dates against the status', () => {
    expect(
      messages({
        steps: [
          {
            ...emptyStep('rfq'),
            status: 'done',
            plannedStart: '2026-10-10',
            plannedEnd: '2026-10-01',
          },
          { ...emptyStep('approval'), status: 'in-progress' },
        ],
      }),
    ).toEqual([
      'steps.0.plannedEnd: Planlanan bitiş başlangıçtan önce olamaz.',
      'steps.0.actualEnd: Tamamlanan adımın bitiş tarihini girin.',
      'steps.1.actualStart: Başlayan adımın başlangıç tarihini girin.',
    ]);
  });

  it('maps empty fields to null', () => {
    const [draft] = toStepDrafts({
      steps: [{ ...emptyStep('rfq'), ownerId: '7', plannedEnd: '2026-11-01', note: ' Not ' }],
    });
    expect(draft).toMatchObject({
      ownerId: 7,
      plannedStart: null,
      plannedEnd: '2026-11-01',
      note: 'Not',
    });
  });

  it('refuses empty notes and credentials', () => {
    expect(noteFormSchema.safeParse({ text: '  ', internal: false }).success).toBe(false);
    expect(noteFormSchema.safeParse({ text: 'password: x', internal: false }).success).toBe(false);
    expect(noteFormSchema.safeParse({ text: 'Teklif geldi', internal: true }).success).toBe(true);
  });
});
