import { describe, expect, it } from 'vitest';
import { demands } from '@/services/mock/data/demands';
import { DEM, PERSON } from '@/services/mock/data/ids';
import type { Demand } from '../types';
import { assessmentFormSchema, toAssessmentFormValues, toAssessmentInput } from './assessmentForm';

const seed = (id: number) => demands.find((d) => d.id === id) as Demand;
const errors = (values: unknown) =>
  assessmentFormSchema.safeParse(values).error?.issues.map((i) => i.path.join('.')) ?? [];

describe('assessment form', () => {
  it('moves a new demand to review and makes the opener its assessor', () => {
    const values = toAssessmentFormValues(seed(DEM.cargoTracking), {
      assessorId: PERSON.canOzturk,
    });
    expect(values).toMatchObject({ status: 'in-review', assessorId: String(PERSON.canOzturk) });
  });

  it('explains what each decision needs', () => {
    const base = toAssessmentFormValues(seed(DEM.cargoTracking));
    expect(errors({ ...base, status: 'rejected' })).toEqual(['decisionNote']);
    expect(errors({ ...base, status: 'scheduled' })).toEqual([
      'priority',
      'plannedStart',
      'plannedEnd',
    ]);
    expect(
      errors({
        ...base,
        status: 'converted',
        priority: 'p2',
        plannedStart: '2027-04-01',
        plannedEnd: '2027-01-01',
      }),
    ).toEqual(['plannedEnd', 'projectId']);
  });

  it('round-trips a stored assessment', () => {
    const demand = seed(DEM.walletBoardingPass);
    const input = toAssessmentInput(toAssessmentFormValues(demand));
    expect(input).toEqual({ ...demand.assessment, status: demand.status });
  });
});
