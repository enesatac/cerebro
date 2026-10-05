import { describe, expect, it } from 'vitest';
import { releaseFormSchema, toReleaseFormValues, toReleaseInput } from './releaseForm';

const valid = () => ({
  ...toReleaseFormValues(undefined, { applicationId: 2, projectId: 1, date: '2026-10-14' }),
  releaseNumber: ' CHG-2026-0500 ',
  title: 'Yeni sürüm',
  type: 'minor',
  startTime: '23:00',
  endTime: '01:30',
});

describe('release form', () => {
  it('pre-fills the application, project and date and maps to the input', () => {
    const values = valid();
    expect(values.status).toBe('planned');
    expect(releaseFormSchema.safeParse(values).success).toBe(true);
    expect(toReleaseInput(values)).toMatchObject({
      releaseNumber: 'CHG-2026-0500',
      applicationId: 2,
      projectId: 1,
      plannedDate: '2026-10-14',
      ownerId: null,
    });
  });

  it('requires the number, title, application, type and date', () => {
    const result = releaseFormSchema.safeParse(toReleaseFormValues(undefined));
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(
      expect.arrayContaining(['releaseNumber', 'title', 'applicationId', 'type', 'plannedDate']),
    );
  });

  it('checks the time window', () => {
    const wrong = releaseFormSchema.safeParse({ ...valid(), startTime: '25:00' });
    expect(wrong.error?.issues[0]?.message).toBe('Saati SS:DD biçiminde girin.');
    const endOnly = releaseFormSchema.safeParse({ ...valid(), startTime: '' });
    expect(endOnly.error?.issues[0]?.path).toEqual(['startTime']);
  });
});
