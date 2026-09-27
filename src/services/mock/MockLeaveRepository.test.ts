import { describe, expect, it } from 'vitest';
import type { LeaveInput } from '@/domains/leaves/types';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { PERSON, USER } from '@/services/mock/data/ids';

const leave = (overrides: Partial<LeaveInput> = {}): LeaveInput => ({
  personId: PERSON.graceMensah,
  type: 'annual',
  startDate: '2027-02-01',
  endDate: '2027-02-05',
  note: '',
  ...overrides,
});

describe('leave repository', () => {
  it('lists leaves overlapping a period, optionally for some people', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const october = await repos.leaves.list({ from: '2026-10-01', to: '2026-10-31' });
    expect(october.length).toBeGreaterThan(0);
    expect(october.every((l) => l.startDate <= '2026-10-31' && l.endDate >= '2026-10-01')).toBe(
      true,
    );
    const jonas = await repos.leaves.list({
      from: '2026-10-01',
      to: '2026-10-31',
      personIds: [PERSON.jonasBerg],
    });
    expect(jonas.map((l) => l.personId)).toEqual([PERSON.jonasBerg]);
  });

  it('lets admins add, move and delete a leave with a sequence id', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const created = await repos.leaves.create(leave());
    expect(created.id).toBeGreaterThan(36);
    const moved = await repos.leaves.update(
      created.id,
      leave({ startDate: '2027-02-08', endDate: '2027-02-09' }),
    );
    expect(moved).toMatchObject({ startDate: '2027-02-08', endDate: '2027-02-09' });
    await repos.leaves.remove(created.id);
    await expect(repos.leaves.getById(created.id)).rejects.toThrow('bulunamadı');
  });

  it('rejects overlapping leaves for the same person and reversed dates', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    await repos.leaves.create(leave());
    await expect(
      repos.leaves.create(leave({ startDate: '2027-02-05', endDate: '2027-02-06' })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repos.leaves.create(leave({ startDate: '2027-03-05', endDate: '2027-03-01' })),
    ).rejects.toBeInstanceOf(ValidationError);
    // Someone else can be away on the same days.
    await expect(repos.leaves.create(leave({ personId: PERSON.jonasBerg }))).resolves.toBeTruthy();
  });

  it('keeps leaves read-only for regular users', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(repos.leaves.create(leave())).rejects.toBeInstanceOf(ForbiddenError);
  });
});
