import { describe, expect, it } from 'vitest';
import type { AllocationInput } from '@/domains/resources/types';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { PERSON, PRJ, USER } from '@/services/mock/data/ids';
import { createMockRepositories } from './index';

const input = (overrides: Partial<AllocationInput> = {}): AllocationInput => ({
  personId: PERSON.oleHansen,
  projectId: PRJ.managementReporting,
  role: 'developer',
  startDate: '2027-01-04',
  endDate: '2027-03-31',
  percent: 40,
  note: '',
  ...overrides,
});

describe('allocation repository', () => {
  it('lists allocations overlapping a period, by person or project', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const october = await repos.allocations.list({ from: '2026-10-01', to: '2026-10-31' });
    expect(october.length).toBeGreaterThan(10);
    const lucas = await repos.allocations.list({
      from: '2026-10-01',
      to: '2026-10-31',
      personIds: [PERSON.lucasMoreau],
    });
    // Lucas runs several projects in parallel.
    expect(new Set(lucas.map((a) => a.projectId)).size).toBeGreaterThan(2);
    const project = await repos.allocations.list({
      from: '2026-01-01',
      to: '2027-12-31',
      projectIds: [PRJ.loyaltyLaunch],
    });
    expect(project.every((a) => a.projectId === PRJ.loyaltyLaunch)).toBe(true);
  });

  it('allows parallel work on different projects but not a double booking on one', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const created = await repos.allocations.create(input());
    expect(created.id).toBeGreaterThan(0);
    await expect(
      repos.allocations.create(input({ projectId: PRJ.legacyBookingRetirement })),
    ).resolves.toBeTruthy();
    await expect(
      repos.allocations.create(input({ startDate: '2027-03-01', endDate: '2027-04-30' })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('validates dates and the percentage step', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    await expect(repos.allocations.create(input({ endDate: '2026-12-01' }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    for (const percent of [0, 33, 120]) {
      await expect(repos.allocations.create(input({ percent }))).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
  });

  it('is read-only for regular users', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(repos.allocations.create(input())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('removes a project’s allocations with the project', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const impact = await repos.projects.getDeletionImpact(PRJ.loyaltyLaunch);
    expect(impact.references.some((r) => r.label.startsWith('kaynak ataması'))).toBe(true);
    await repos.projects.remove(PRJ.loyaltyLaunch);
    const left = await repos.allocations.list({
      from: '2020-01-01',
      to: '2030-12-31',
      projectIds: [PRJ.loyaltyLaunch],
    });
    expect(left).toEqual([]);
  });
});
