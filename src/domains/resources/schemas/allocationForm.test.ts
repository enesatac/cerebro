import { describe, expect, it } from 'vitest';
import {
  allocationFormSchema,
  PERCENT_CHOICES,
  toAllocationFormValues,
  toAllocationInput,
} from './allocationForm';

describe('allocation form', () => {
  it('offers 5 % steps up to full time', () => {
    expect(PERCENT_CHOICES[0]).toBe(5);
    expect(PERCENT_CHOICES.at(-1)).toBe(100);
    expect(PERCENT_CHOICES).toHaveLength(20);
  });

  it('round-trips a planner prefill into a typed input', () => {
    const values = {
      ...toAllocationFormValues(undefined, { personId: 24, date: '2026-11-02' }),
      projectId: '4',
      endDate: '2027-01-29',
      percent: '40',
    };
    expect(allocationFormSchema.safeParse(values).success).toBe(true);
    expect(toAllocationInput(values)).toEqual({
      personId: 24,
      projectId: 4,
      role: 'developer',
      startDate: '2026-11-02',
      endDate: '2027-01-29',
      percent: 40,
      note: '',
    });
  });

  it('rejects an end before the start', () => {
    const result = allocationFormSchema.safeParse({
      ...toAllocationFormValues(undefined, { personId: 1, projectId: 1, date: '2026-11-02' }),
      endDate: '2026-10-01',
    });
    expect(result.success).toBe(false);
  });
});
