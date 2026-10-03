import { describe, expect, it } from 'vitest';
import type { Demand, DemandAssessmentInput, DemandInput } from '@/domains/demands/types';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { APP, BU, DEM, PERSON, PRJ, USER } from './data/ids';

const request = (overrides: Partial<DemandInput> = {}): DemandInput => ({
  title: 'Kampanya yönetim ekranı',
  type: 'enhancement',
  businessUnitId: BU.digitalChannels,
  requesterId: PERSON.elifKaya,
  sponsorId: null,
  problem: 'Kampanyalar elle tanımlanıyor.',
  proposedSolution: '',
  expectedBenefits: 'Daha hızlı kampanya çıkışı.',
  benefitTypes: ['revenue'],
  urgency: 'medium',
  desiredDate: null,
  deadlineReason: '',
  regulatory: false,
  affectedUsers: null,
  estimatedBudget: null,
  currency: 'TRY',
  relatedApplicationIds: [APP.customerPortal],
  ...overrides,
});

const assessment = (
  demand: Demand,
  overrides: Partial<DemandAssessmentInput> = {},
): DemandAssessmentInput => ({ ...demand.assessment, status: demand.status, ...overrides });

describe('demand repository', () => {
  it('lets any user submit a demand, with a code and a submitted event', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const created = await repos.demands.create(request());
    expect(created.id).toBe(DEM.cargoTracking + 1);
    expect(created.code).toBe(`TLP-00${DEM.cargoTracking + 1}`);
    expect(created.status).toBe('submitted');
    expect(created.history.map((e) => [e.status, e.byId])).toEqual([
      ['submitted', PERSON.elifKaya],
    ]);
  });

  it('refuses unknown master data codes and credentials', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(repos.demands.create(request({ type: 'magic' }))).rejects.toThrow(ValidationError);
    await expect(repos.demands.create(request({ problem: 'token: abc123' }))).rejects.toMatchObject(
      { field: 'problem' },
    );
  });

  it('lets requesters change only their own undecided demands', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const own = await repos.demands.getById(DEM.notificationPreferences);
    await expect(
      repos.demands.update(own.id, { ...own, title: 'Bildirim tercihleri' }),
    ).resolves.toMatchObject({ title: 'Bildirim tercihleri' });

    const scheduled = await repos.demands.getById(DEM.walletBoardingPass);
    await expect(repos.demands.update(scheduled.id, scheduled)).rejects.toThrow(ForbiddenError);
    const someoneElses = await repos.demands.getById(DEM.cargoTracking);
    await expect(repos.demands.update(someoneElses.id, someoneElses)).rejects.toThrow(
      ForbiddenError,
    );
    await expect(
      repos.demands.assess(own.id, assessment(own, { status: 'approved' })),
    ).rejects.toThrow(ForbiddenError);
  });

  it('puts a demand back in the queue when its requester answers a question', async () => {
    const admin = createMockRepositories({ signedInAs: USER.canOzturk });
    const demand = await admin.demands.getById(DEM.notificationPreferences);
    await expect(
      admin.demands.assess(demand.id, assessment(demand, { status: 'needs-info' })),
    ).rejects.toMatchObject({ field: 'decisionNote' });
    const asked = await admin.demands.assess(
      demand.id,
      assessment(demand, { status: 'needs-info', decisionNote: 'SMS hacmini ekleyin.' }),
    );
    expect(asked.history.at(-1)).toMatchObject({
      status: 'needs-info',
      note: 'SMS hacmini ekleyin.',
    });

    // Same database, now as the requester.
    await admin.auth.signIn(USER.elifKaya);
    const answered = await admin.demands.update(demand.id, {
      ...asked,
      problem: `${asked.problem} Ayda 2 milyon SMS.`,
    });
    expect(answered.status).toBe('submitted');
    expect(answered.history.at(-1)?.note).toBe('Talep sahibi istenen bilgiyi ekledi.');
  });

  it('requires dates to schedule, a priority to approve and a project to convert', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const demand = await repos.demands.getById(DEM.serviceChatbot);
    await expect(
      repos.demands.assess(demand.id, assessment(demand, { status: 'approved' })),
    ).rejects.toMatchObject({ field: 'priority' });
    await expect(
      repos.demands.assess(demand.id, assessment(demand, { status: 'scheduled', priority: 'p2' })),
    ).rejects.toMatchObject({ field: 'plannedStart' });
    await expect(
      repos.demands.assess(
        demand.id,
        assessment(demand, {
          status: 'scheduled',
          priority: 'p2',
          plannedStart: '2027-04-01',
          plannedEnd: '2027-03-01',
        }),
      ),
    ).rejects.toMatchObject({ field: 'plannedEnd' });
    const scheduled = await repos.demands.assess(
      demand.id,
      assessment(demand, {
        status: 'scheduled',
        priority: 'p2',
        plannedStart: '2027-04-01',
        plannedEnd: '2027-09-30',
        decisionNote: '2027 Ç2’de başlıyor.',
      }),
    );
    expect(scheduled.history.at(-1)).toMatchObject({
      status: 'scheduled',
      byId: PERSON.canOzturk,
      note: '2027 Ç2’de başlıyor.',
    });
    await expect(
      repos.demands.assess(demand.id, assessment(scheduled, { status: 'converted' })),
    ).rejects.toMatchObject({ field: 'projectId' });
  });

  it('lets requesters withdraw their open demand, once', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const withdrawn = await repos.demands.withdraw(DEM.notificationPreferences, 'Gerek kalmadı.');
    expect(withdrawn.status).toBe('withdrawn');
    await expect(repos.demands.withdraw(DEM.notificationPreferences, '')).rejects.toThrow(
      ForbiddenError,
    );
    await expect(repos.demands.withdraw(DEM.cargoTracking, '')).rejects.toThrow(ForbiddenError);
  });

  it('lets requesters attach files to their own open demand only', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const file = new File(['%PDF-1.4'], 'is-gerekcesi.pdf', { type: 'application/pdf' });
    const upload = (id: number) =>
      repos.attachments.upload({
        owner: { type: 'demand', id },
        documentType: 'business-case',
        description: '',
        file,
        fileName: file.name,
      });
    await expect(upload(DEM.notificationPreferences)).resolves.toMatchObject({
      fileName: 'is-gerekcesi.pdf',
    });
    await expect(upload(DEM.cargoTracking)).rejects.toThrow(ForbiddenError);
  });

  it('unlinks deleted applications and projects', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    await repos.projects.remove(PRJ.loyaltyLaunch);
    expect((await repos.demands.getById(DEM.loyaltyMobile)).assessment.projectId).toBeNull();
    const impact = await repos.applications.getDeletionImpact(APP.customerPortal);
    expect(impact.references).toContainEqual({ label: 'talep (bağlantı kaldırılır)', count: 5 });
  });
});
