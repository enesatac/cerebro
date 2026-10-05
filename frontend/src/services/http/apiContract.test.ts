/**
 * Contract test between the two implementations of `Repositories`: the in-memory mock and the
 * Cerebro API (../backend). Both start from the same demo data, so every read must return the
 * same thing and every write must have the same effect and the same validation errors.
 *
 * Opt-in: needs a freshly started API with the demo data (`cerebro.demo-data=true`, an empty
 * database) and runs only when `CEREBRO_API_URL` is set, e.g.
 *   CEREBRO_API_URL=http://localhost:8080 npx vitest run src/services/http/apiContract.test.ts
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { ATTACHMENT_OWNER_TYPES } from '@/domains/attachments/types';
import { MASTER_DATA_LIST_KEYS } from '@/domains/master-data/types';
import { createMockRepositories } from '@/services/mock';
import { USER } from '@/services/mock/data/ids';
import type { Repositories } from '../repositories';
import { createHttpClient } from './client';
import { createHttpRepositories } from './httpRepositories';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
const API_URL = env?.CEREBRO_API_URL;

/** A minimal cookie jar: the API session and CSRF cookies, as a browser would keep them. */
function cookieFetch(): { fetch: typeof fetch; cookie: (name: string) => string | null } {
  const jar = new Map<string, string>();
  const send: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (jar.size > 0) {
      headers.set('Cookie', [...jar].map(([name, value]) => `${name}=${value}`).join('; '));
    }
    const response = await globalThis.fetch(input, { ...init, headers });
    for (const line of response.headers.getSetCookie()) {
      const [pair = ''] = line.split(';');
      const index = pair.indexOf('=');
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (/max-age=0/i.test(line) || value === '') jar.delete(name);
      else jar.set(name, value);
    }
    return response;
  };
  return { fetch: send, cookie: (name) => jar.get(name) ?? null };
}

const startedAt = Date.now();
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Comparable form: timestamps written during this run become `NOW` (the two implementations stamp
 * them a few milliseconds apart), other timestamps are normalised to one format.
 */
function normalise(value: unknown): unknown {
  if (typeof value === 'string' && ISO_TIMESTAMP.test(value)) {
    const time = Date.parse(value);
    return time >= startedAt - 60_000 ? 'NOW' : new Date(time).toISOString();
  }
  if (Array.isArray(value)) return value.map(normalise);
  if (value instanceof Map) return normalise(Object.fromEntries(value));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, normalise(v)]),
    );
  }
  return value;
}

/** The value, or the error a call failed with (class code, message and field). */
async function outcome(call: () => Promise<unknown>): Promise<unknown> {
  try {
    return normalise(await call());
  } catch (error) {
    const e = error as { code?: string; message?: string; field?: string };
    return { error: e.code, message: e.message, field: e.field };
  }
}

describe.skipIf(!API_URL)('mock and API return the same', () => {
  let mock: Repositories;
  let api: Repositories;

  /** Runs the same call against both implementations and compares the outcomes. */
  async function same(label: string, call: (repositories: Repositories) => Promise<unknown>) {
    const [expected, actual] = [await outcome(() => call(mock)), await outcome(() => call(api))];
    expect.soft(actual, label).toEqual(expected);
    return actual;
  }

  beforeAll(async () => {
    mock = createMockRepositories();
    await mock.auth.signIn(USER.canOzturk);
    const browser = cookieFetch();
    const http = createHttpClient({
      baseUrl: API_URL,
      fetch: browser.fetch,
      csrfToken: () => browser.cookie('XSRF-TOKEN'),
    });
    api = createHttpRepositories(http);
    await api.auth.listSignInAccounts();
    await api.auth.signIn(USER.canOzturk);
  });

  const today = new Date().toISOString().slice(0, 10);

  it('reads the reference data', async () => {
    await same('sign-in accounts', (r) => r.auth.listSignInAccounts());
    await same('users', (r) => r.users.list());
    await same('roles', (r) => r.roles.list());
    await same('master data', (r) => r.masterData.listAll());
    for (const key of MASTER_DATA_LIST_KEYS) {
      await same(`usage ${key}`, (r) => r.masterData.getUsage(key));
    }
    await same('business units', (r) => r.businessUnits.list());
    const people = await mock.people.list();
    await same('people', (r) => r.people.list());
    for (const person of people) {
      await same(`workload ${person.id}`, (r) => r.people.getWorkload(person.id, today));
      await same(`person impact ${person.id}`, (r) => r.people.getDeletionImpact(person.id));
    }
    await same('teams', (r) => r.teams.list());
    await same('team summaries', (r) => r.teams.listSummaries());
    for (const team of await mock.teams.list()) {
      await same(`team impact ${team.id}`, (r) => r.teams.getDeletionImpact(team.id));
    }
    await same('technologies', (r) => r.technologies.list());
    await same('technology summaries', (r) => r.technologies.listSummaries());
    for (const technology of await mock.technologies.list()) {
      await same(`technology impact ${technology.id}`, (r) =>
        r.technologies.getDeletionImpact(technology.id),
      );
    }
    for (const unit of await mock.businessUnits.list()) {
      await same(`unit impact ${unit.id}`, (r) => r.businessUnits.getDeletionImpact(unit.id));
    }
  });

  it('reads the portfolio', async () => {
    const page = { page: 0, pageSize: 100 };
    await same('applications', (r) => r.applications.list(page));
    for (const field of [
      'name',
      'code',
      'lifecycle',
      'criticality',
      'businessUnit',
      'updatedAt',
    ] as const) {
      for (const direction of ['asc', 'desc'] as const) {
        await same(`applications by ${field} ${direction}`, (r) =>
          r.applications.list({ ...page, sort: { field, direction } }),
        );
      }
    }
    await same('application filters', (r) =>
      r.applications.list({ ...page, search: 'ödeme', lifecycles: ['active'], criticalities: [] }),
    );
    await same('applications page 2', (r) => r.applications.list({ page: 1, pageSize: 5 }));
    await same('application refs', (r) => r.applications.listRefs());
    for (const app of await mock.applications.listRefs()) {
      await same(`application ${app.id}`, (r) => r.applications.getById(app.id));
      await same(`application impact ${app.id}`, (r) => r.applications.getDeletionImpact(app.id));
      await same(`dependencies of ${app.id}`, (r) =>
        r.connections.getApplicationDependencies(app.id),
      );
      await same(`integrations of ${app.id}`, (r) =>
        r.connections.getApplicationIntegrations(app.id),
      );
      await same(`projects of ${app.id}`, (r) => r.projects.listByApplication(app.id));
      await same(`runbook of ${app.id}`, (r) => r.runbooks.getByApplication(app.id));
      await same(`risks of ${app.id}`, (r) => r.risks.list({ applicationId: app.id }));
      await same(`decisions of ${app.id}`, (r) => r.decisions.list({ applicationId: app.id }));
    }
    await same('projects', (r) => r.projects.list(page));
    for (const field of [
      'name',
      'code',
      'status',
      'health',
      'priority',
      'plannedEndDate',
    ] as const) {
      await same(`projects by ${field}`, (r) =>
        r.projects.list({ ...page, sort: { field, direction: 'desc' } }),
      );
    }
    for (const project of await mock.projects.listRefs()) {
      await same(`project ${project.id}`, (r) => r.projects.getById(project.id));
      await same(`project impact ${project.id}`, (r) => r.projects.getDeletionImpact(project.id));
      await same(`escalations of ${project.id}`, (r) =>
        r.escalations.list({ projectId: project.id }),
      );
    }
    await same('dependencies', (r) => r.connections.listDependencies());
    await same('integrations', (r) => r.connections.listIntegrations());
    await same('risks', (r) => r.risks.list());
    await same('escalations', (r) => r.escalations.list());
    await same('decisions', (r) => r.decisions.list());
  });

  it('reads the dashboard, reports and search', async () => {
    await same('overview', (r) => r.governance.getPortfolioOverview());
    await same('application health', (r) => r.governance.getApplicationHealthReport());
    await same('trends', (r) => r.governance.getTrends({ from: '2025-10-01', months: 15 }, today));
    for (const term of ['ödeme', 'ODE', 'platform', 'İ', 'zzz']) {
      await same(`search ${term}`, (r) => r.search.search({ term }));
    }
    await same('search kinds', (r) => r.search.search({ term: 'a', kinds: ['person'], limit: 3 }));
  });

  it('reads planning, demands, contracts and files', async () => {
    await same('leaves', (r) => r.leaves.list({ from: '2025-01-01', to: '2027-12-31' }));
    await same('leaves of nobody', (r) =>
      r.leaves.list({ from: '2025-01-01', to: '2027-12-31', personIds: [] }),
    );
    await same('allocations', (r) => r.allocations.list({ from: '2025-01-01', to: '2027-12-31' }));
    await same('allocations of a project', (r) =>
      r.allocations.list({ from: '2026-01-01', to: '2026-12-31', projectIds: [1] }),
    );
    await same('demands', (r) => r.demands.list());
    await same('contracts', (r) => r.contracts.list());
    await same('contracts of project 1', (r) => r.contracts.list({ projectId: 1 }));
    await same('vendors', (r) => r.vendors.list());
    await same('procurement', (r) => r.procurement.list());
    for (const contract of await mock.contracts.list()) {
      await same(`procurement ${contract.id}`, (r) => r.procurement.getById(contract.id));
      await same(`contract impact ${contract.id}`, (r) =>
        r.contracts.getDeletionImpact(contract.id),
      );
    }
    await same('missing procurement', (r) => r.procurement.getById(99_999));
    for (const type of ATTACHMENT_OWNER_TYPES) {
      await same(`file counts ${type}`, (r) => r.attachments.countByOwner(type));
    }
    await same('files of application 1', (r) => r.attachments.list({ type: 'application', id: 1 }));
    const [expected, actual] = await Promise.all([
      mock.attachments.download(1),
      api.attachments.download(1),
    ]);
    expect(actual.size).toBe(expected.size);
  });

  it('writes the same way', async () => {
    const application = await same('create application', (r) =>
      r.applications.create({
        code: 'TEST-1',
        name: 'Sözleşme testi',
        shortDescription: 'Kısa',
        detailedDescription: '',
        businessPurpose: 'Amaç',
        type: 'web-application',
        lifecycle: 'active',
        criticality: 'high',
        operationalStatus: 'operational',
        tags: ['test'],
        businessUnitId: 1,
        businessProcesses: [],
        userGroups: ['Müşteriler'],
        estimatedUserCount: 10,
        roles: [{ id: null, personId: 2, role: 'technical-owner' }],
        teams: [{ id: null, teamId: 1, responsibility: 'development' }],
        technologies: [{ id: null, technologyId: 1, layer: 'frontend', version: '19' }],
        dataStores: [],
        hosting: { model: 'public-cloud', cloudProvider: 'AWS' },
        repositories: [],
        environments: [
          {
            id: null,
            type: 'production',
            name: 'Canlı',
            url: null,
            status: 'available',
            region: null,
          },
        ],
        documentation: [
          { id: null, type: 'confluence', title: 'Wiki', url: 'https://wiki.example/x' },
        ],
      }),
    );
    const created = application as { id: number };
    await same('duplicate code', async (r) => {
      const current = await r.applications.getById(created.id);
      return r.applications.create({ ...current, code: 'test-1' });
    });
    await same('update application', async (r) => {
      const current = await r.applications.getById(created.id);
      return r.applications.update(created.id, {
        ...current,
        name: 'Yeni ad',
        roles: [...current.roles, { id: null, personId: 3, role: 'business-owner' }],
        environments: [],
      });
    });
    await same('foreign child id', async (r) => {
      const current = await r.applications.getById(created.id);
      return r.applications.update(created.id, {
        ...current,
        roles: [{ id: 1, personId: 3, role: 'business-owner' }],
      });
    });
    await same('inactive code', async (r) => {
      const current = await r.applications.getById(created.id);
      return r.applications.update(created.id, { ...current, lifecycle: 'nope' as 'active' });
    });
    await same('application list after', (r) => r.applications.list({ page: 0, pageSize: 100 }));

    const project = (await same('create project', async (r) => {
      const base = await r.projects.getById(1);
      return r.projects.create({
        ...base,
        code: 'TP-1',
        name: 'Test projesi',
        milestones: base.milestones.map((m) => ({ ...m, id: null })),
        roles: base.roles.map((role) => ({ ...role, id: null })),
        teams: base.teams.map((team) => ({ ...team, id: null })),
        documentation: [],
        applicationImpacts: [
          { id: null, applicationId: created.id, impactType: 'modifies', description: '' },
        ],
      });
    })) as { id: number };
    await same('project delete blocked', (r) => r.projects.remove(1));

    await same('create risk', (r) =>
      r.risks.create({
        title: 'Test riski',
        description: '',
        category: 'technical',
        probability: 'high',
        impact: 'high',
        severity: 'critical',
        status: 'open',
        ownerId: 2,
        mitigationPlan: '',
        dueDate: '2026-12-31',
        relatedProjectIds: [project.id],
        relatedApplicationIds: [created.id],
      }),
    );
    await same('risk with secret', (r) =>
      r.risks.create({
        title: 'x',
        description: 'password: hunter2',
        category: 'technical',
        probability: 'low',
        impact: 'low',
        severity: 'low',
        status: 'open',
        ownerId: null,
        mitigationPlan: '',
        dueDate: null,
        relatedProjectIds: [],
        relatedApplicationIds: [],
      }),
    );
    await same('create runbook', (r) =>
      r.runbooks.create({
        applicationId: created.id,
        summary: 'Özet',
        firstResponse: [
          { id: null, text: 'Panoya bak' },
          { id: null, text: '  ' },
        ],
        links: [
          { id: null, type: 'monitoring', label: 'Grafana', url: 'https://g.example', note: '' },
        ],
        contacts: [
          { id: null, label: 'Nöbetçi', personId: 2, teamId: null, channel: '', when: '' },
        ],
        scenarios: [
          {
            id: null,
            title: 'Yavaşlık',
            symptoms: 'p95 yüksek',
            steps: [{ id: null, text: 'Yeniden başlat' }],
          },
        ],
        lastVerifiedOn: null,
      }),
    );
    await same('create leave', (r) =>
      r.leaves.create({
        personId: 2,
        type: 'annual',
        startDate: '2027-02-01',
        endDate: '2027-02-05',
        note: ' Tatil ',
      }),
    );
    await same('overlapping leave', (r) =>
      r.leaves.create({
        personId: 2,
        type: 'annual',
        startDate: '2027-02-03',
        endDate: '2027-02-09',
        note: '',
      }),
    );
    await same('create allocation', (r) =>
      r.allocations.create({
        personId: 2,
        projectId: project.id,
        role: 'developer',
        startDate: '2027-01-01',
        endDate: '2027-03-31',
        percent: 50,
        note: '',
      }),
    );
    await same('bad allocation percent', (r) =>
      r.allocations.create({
        personId: 2,
        projectId: project.id,
        role: 'developer',
        startDate: '2027-05-01',
        endDate: '2027-05-31',
        percent: 33,
        note: '',
      }),
    );

    const demand = (await same('create demand', (r) =>
      r.demands.create({
        title: 'Test talebi',
        type: 'enhancement',
        businessUnitId: 1,
        requesterId: 1,
        sponsorId: null,
        problem: 'Sorun',
        proposedSolution: '',
        expectedBenefits: 'Fayda',
        benefitTypes: ['revenue', 'revenue'],
        urgency: 'high',
        desiredDate: null,
        deadlineReason: '',
        regulatory: false,
        affectedUsers: null,
        estimatedBudget: 1500,
        currency: 'EUR',
        relatedApplicationIds: [created.id],
      }),
    )) as { id: number };
    await same('assess without note', (r) =>
      r.demands.assess(demand.id, {
        businessValue: 4,
        strategicFit: 3,
        timeCriticality: 2,
        riskReduction: 1,
        effort: 2,
        priority: null,
        assessorId: 6,
        plannedStart: null,
        plannedEnd: null,
        decisionNote: '',
        projectId: null,
        status: 'rejected',
      }),
    );
    await same('assess', (r) =>
      r.demands.assess(demand.id, {
        businessValue: 4,
        strategicFit: 3,
        timeCriticality: 2,
        riskReduction: 1,
        effort: 2,
        priority: 'p2',
        assessorId: 6,
        plannedStart: '2027-01-01',
        plannedEnd: '2027-06-30',
        decisionNote: 'Uygun',
        projectId: null,
        status: 'scheduled',
      }),
    );
    await same('withdraw', (r) => r.demands.withdraw(demand.id, 'Vazgeçtik'));

    const vendor = (await same('create vendor', (r) =>
      r.vendors.create({
        name: ' Test A.Ş. ',
        taxNumber: '1234567890',
        contactName: '',
        contactEmail: 'A@B.EXAMPLE',
        contactPhone: '',
        website: '',
        notes: '',
      }),
    )) as { id: number };
    const contract = (await same('create contract', (r) =>
      r.contracts.create({
        title: 'Test sözleşmesi',
        projectId: project.id,
        vendorId: vendor.id,
        type: 'license',
        status: 'active',
        description: '',
        ownerId: 2,
        purchaseOrderNumber: 'PO-1',
        signedDate: null,
        startDate: '2027-01-01',
        endDate: '2027-12-31',
        noticePeriodDays: 30,
        autoRenewal: true,
        totalValue: 1000,
        currency: 'EUR',
        billingFrequency: 'monthly',
        relatedApplicationIds: [created.id],
        payments: [
          {
            id: null,
            description: 'Son',
            dueDate: '2027-06-01',
            amount: 400,
            status: 'planned',
            invoiceNumber: '',
            paidDate: null,
          },
          {
            id: null,
            description: 'İlk',
            dueDate: '2027-01-15',
            amount: 600,
            status: 'paid',
            invoiceNumber: 'F1',
            paidDate: '2027-01-20',
          },
        ],
      }),
    )) as { id: number };

    const step = {
      id: null,
      type: 'rfq',
      status: 'done',
      ownerId: 2,
      plannedStart: '2027-01-01',
      plannedEnd: '2027-01-10',
      actualStart: '2027-01-02',
      actualEnd: '2027-01-12',
      note: ' Üç teklif ',
    };
    await same('procurement steps without end', (r) =>
      r.procurement.saveSteps(contract.id, [{ ...step, actualEnd: null }]),
    );
    await same('procurement steps reversed', (r) =>
      r.procurement.saveSteps(contract.id, [{ ...step, plannedEnd: '2026-12-01' }]),
    );
    await same('procurement unknown status', (r) =>
      r.procurement.saveSteps(contract.id, [{ ...step, status: 'lost' }]),
    );
    await same('procurement unknown owner', (r) =>
      r.procurement.saveSteps(contract.id, [{ ...step, ownerId: 99_999 }]),
    );
    const saved = (await same('procurement steps', (r) =>
      r.procurement.saveSteps(contract.id, [
        step,
        { ...step, type: 'approval', status: 'in-progress', actualEnd: null, note: '' },
      ]),
    )) as { steps: { id: number }[] };
    await same('procurement steps reordered', (r) =>
      r.procurement.saveSteps(contract.id, [...saved.steps].reverse() as never),
    );
    await same('procurement foreign step', (r) =>
      r.procurement.saveSteps(contract.id, [{ ...step, id: 1 }]),
    );
    const note = (await same('procurement internal note', (r) =>
      r.procurement.addNote(contract.id, { text: ' Bütçe aşımı riski ', internal: true }),
    )) as { id: number };
    await same('procurement public note', (r) =>
      r.procurement.addNote(contract.id, { text: 'Teklifler açıldı.', internal: false }),
    );
    await same('procurement empty note', (r) =>
      r.procurement.addNote(contract.id, { text: '  ', internal: false }),
    );
    await same('procurement after notes', (r) => r.procurement.getById(contract.id));
    await same('procurement remove note', (r) => r.procurement.removeNote(note.id));
    await same('procurement missing note', (r) => r.procurement.removeNote(note.id));
    await same('contract impact with process', (r) => r.contracts.getDeletionImpact(contract.id));
    await same('person impact with process', (r) => r.people.getDeletionImpact(2));
    await same('contract over budget', (r) =>
      r.contracts.create({
        title: 'x',
        projectId: project.id,
        vendorId: vendor.id,
        type: 'license',
        status: 'draft',
        description: '',
        ownerId: null,
        purchaseOrderNumber: '',
        signedDate: null,
        startDate: null,
        endDate: null,
        noticePeriodDays: null,
        autoRenewal: false,
        totalValue: 10,
        currency: 'EUR',
        billingFrequency: 'one-time',
        relatedApplicationIds: [],
        payments: [
          {
            id: null,
            description: '',
            dueDate: '2027-01-01',
            amount: 11,
            status: 'planned',
            invoiceNumber: '',
            paidDate: null,
          },
        ],
      }),
    );
    await same('vendor in use', (r) => r.vendors.remove(vendor.id));

    await same('create role', (r) =>
      r.roles.create({
        name: 'Test rolü',
        description: '',
        privileges: ['projects:delete', 'nope' as 'roles:view'],
      }),
    );
    await same('duplicate role', (r) =>
      r.roles.create({ name: 'TEST ROLÜ', description: '', privileges: [] }),
    );
    await same('create user', (r) =>
      r.users.create({
        displayName: 'Test',
        email: 'test@corp.example',
        roleIds: [5],
        personId: null,
        active: true,
      }),
    );
    await same('remove own account', (r) => r.users.remove(USER.canOzturk));

    await same('master data edit', async (r) => {
      const list = (await r.masterData.listAll()).find((l) => l.key === 'applicationTypes');
      return r.masterData.update('applicationTypes', [
        ...(list?.items ?? []),
        { id: null, code: 'kiosk', label: 'Kiosk', description: '', variant: null, active: true },
      ]);
    });
    await same('master data remove used', async (r) => {
      const list = (await r.masterData.listAll()).find((l) => l.key === 'applicationTypes');
      return r.masterData.update(
        'applicationTypes',
        (list?.items ?? []).filter((i) => i.code !== 'web-application'),
      );
    });

    await same('impact after writes', (r) => r.applications.getDeletionImpact(created.id));
    await same('workload after writes', (r) => r.people.getWorkload(2, today));
    await same('overview after writes', (r) => r.governance.getPortfolioOverview());
    await same('delete application', (r) => r.applications.remove(created.id));
    await same('project after application delete', (r) => r.projects.getById(project.id));
    await same('demand after application delete', (r) => r.demands.getById(demand.id));
    await same('missing application', (r) => r.applications.getById(created.id));
  });
});
