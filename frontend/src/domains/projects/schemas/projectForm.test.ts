import { describe, expect, it } from 'vitest';
import { projects } from '@/services/mock/data/projects';
import { projectFormSchema, toProjectFormValues, toProjectInput } from './projectForm';

describe('project form mapping', () => {
  it('round-trips every seed project', () => {
    for (const project of projects) {
      const { id: _id, audit: _audit, ...expected } = structuredClone(project);
      const values = toProjectFormValues(project);
      expect(projectFormSchema.safeParse(values).success).toBe(true);
      expect(toProjectInput(values)).toEqual(expected);
    }
  });

  it('validates dates, completion and duplicate impacts', () => {
    const base = toProjectFormValues(projects[0]);
    const result = projectFormSchema.safeParse({
      ...base,
      plannedStartDate: '2026-05-01',
      plannedEndDate: '2026-01-01',
      status: 'completed',
      progressPercentage: '80',
      applicationImpacts: [...base.applicationImpacts, base.applicationImpacts[0]],
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
    expect(paths).toEqual(
      expect.arrayContaining([
        'plannedEndDate',
        'progressPercentage',
        `applicationImpacts.${base.applicationImpacts.length}.applicationId`,
      ]),
    );
  });

  it('drops financials when tracking is switched off', () => {
    const values = { ...toProjectFormValues(projects[0]), hasFinancials: false };
    expect(toProjectInput(values).financials).toBeNull();
  });
});
