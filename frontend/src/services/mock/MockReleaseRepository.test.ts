import { describe, expect, it } from 'vitest';
import type { ReleaseInput } from '@/domains/releases/types';
import { ForbiddenError, NotFoundError, type ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { APP, PERSON, PRJ, USER } from './data/ids';

const input = (overrides: Partial<ReleaseInput> = {}): ReleaseInput => ({
  releaseNumber: ' CHG-2026-0900 ',
  title: 'Test geçişi',
  applicationId: APP.paymentGateway,
  projectId: PRJ.paymentModernisation,
  type: 'minor',
  status: 'planned',
  plannedDate: '2026-12-01',
  startTime: '23:00',
  endTime: '01:00',
  version: '6.1.0',
  ownerId: PERSON.rafaelGomez,
  serviceInterruption: true,
  description: 'Kapsam',
  rollbackPlan: '',
  outcomeNote: '',
  ...overrides,
});

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => error as ValidationError,
  );

describe('release repository', () => {
  it('lists releases by period, application and project in window order', async () => {
    const { releases } = createMockRepositories({ signedInAs: USER.canOzturk });
    const october = await releases.list({ from: '2026-10-01', to: '2026-10-31' });
    expect(october.length).toBeGreaterThan(3);
    expect(october.every((r) => r.plannedDate.startsWith('2026-10'))).toBe(true);
    const dates = october.map((r) => `${r.plannedDate} ${r.startTime}`);
    expect(dates).toEqual([...dates].sort());
    const payments = await releases.list({ applicationId: APP.paymentGateway });
    expect(payments.every((r) => r.applicationId === APP.paymentGateway)).toBe(true);
    const project = await releases.list({ projectId: PRJ.digitalOnboarding });
    expect(project.map((r) => r.releaseNumber)).toContain('CHG-2026-0350');
  });

  it('records a release with trimmed text and refuses a duplicate number', async () => {
    const { releases } = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const created = await releases.create(input());
    expect(created.releaseNumber).toBe('CHG-2026-0900');
    expect(created.audit.createdBy).toBe(PERSON.zeynepCelik);
    const duplicate = await rejection(releases.create(input({ releaseNumber: 'chg-2026-0900' })));
    expect(duplicate.field).toBe('releaseNumber');
    expect(duplicate.message).toBe('chg-2026-0900 numaralı bir geçiş zaten var.');
    await expect(
      releases.update(created.id, input({ status: 'completed' })),
    ).resolves.toMatchObject({ status: 'completed' });
  });

  it('validates references, codes, dates, times and credentials', async () => {
    const { releases } = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const cases: [Partial<ReleaseInput>, string][] = [
      [{ releaseNumber: '  ' }, 'releaseNumber'],
      [{ title: '' }, 'title'],
      [{ applicationId: 9999 }, 'applicationId'],
      [{ projectId: 9999 }, 'projectId'],
      [{ type: 'nope' }, 'type'],
      [{ status: 'nope' }, 'status'],
      [{ plannedDate: '2026-13' }, 'plannedDate'],
      [{ startTime: '24:00' }, 'startTime'],
      [{ startTime: '' }, 'startTime'],
      [{ description: 'password=Hunter2!' }, 'description'],
    ];
    for (const [overrides, field] of cases) {
      expect((await rejection(releases.create(input(overrides)))).field).toBe(field);
    }
  });

  it('lets business units read but not record releases', async () => {
    const { releases } = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(releases.list()).resolves.not.toHaveLength(0);
    await expect(releases.create(input())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('goes with its application and loses its project when the project is deleted', async () => {
    const repositories = createMockRepositories({ signedInAs: USER.canOzturk });
    const appImpact = await repositories.applications.getDeletionImpact(APP.notificationService);
    expect(appImpact.references.map((r) => r.label)).toContain('canlı geçiş (silinir)');
    const people = await repositories.people.getDeletionImpact(PERSON.keremYildiz);
    expect(people.references.map((r) => r.label)).toContain('canlı geçiş sorumluluğu');
    const created = await repositories.releases.create(input({ projectId: PRJ.loyaltyLaunch }));
    const projectImpact = await repositories.projects.getDeletionImpact(PRJ.loyaltyLaunch);
    expect(projectImpact.references.map((r) => r.label)).toContain(
      'canlı geçiş (proje bağı kaldırılır)',
    );
    await repositories.releases.remove(created.id);
    await expect(repositories.releases.getById(created.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
