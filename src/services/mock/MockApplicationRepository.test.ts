import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@/lib/errors';
import { createMockRepositories } from './index';

const baseQuery = { page: 0, pageSize: 100 };

describe('MockApplicationRepository', () => {
  const { applications } = createMockRepositories();

  it('lists applications sorted by name by default', async () => {
    const result = await applications.list(baseQuery);
    const names = result.items.map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(result.total).toBe(result.items.length);
  });

  it('answers "which applications use Oracle?" via the technology filter', async () => {
    const result = await applications.list({ ...baseQuery, technologyId: 'tech-oracle' });
    expect(result.items.map((item) => item.code).sort()).toEqual(['CREW', 'FINP', 'LBC', 'PAYGW']);
  });

  it('combines filters with AND semantics', async () => {
    const result = await applications.list({
      ...baseQuery,
      criticalities: ['critical'],
      teamId: 'team-platform',
    });
    expect(result.items.map((item) => item.code)).toEqual(['CIP']);
  });

  it('matches search terms across code, description and tags, ignoring accents and case', async () => {
    expect(
      (await applications.list({ ...baseQuery, search: 'paygw' })).items.map((i) => i.code),
    ).toEqual(['PAYGW']);
    expect(
      (await applications.list({ ...baseQuery, search: 'PCI-DSS' })).items.map((i) => i.code),
    ).toEqual(['PAYGW']);
  });

  it('sorts enumerations by business rank, not alphabetically', async () => {
    const result = await applications.list({
      ...baseQuery,
      sort: { field: 'criticality', direction: 'desc' },
    });
    const ranks = ['low', 'medium', 'high', 'critical'];
    const values = result.items.map((item) => ranks.indexOf(item.criticality));
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('sorts missing values last in both directions', async () => {
    for (const direction of ['asc', 'desc'] as const) {
      const result = await applications.list({
        ...baseQuery,
        sort: { field: 'technicalOwner', direction },
      });
      expect(result.items.at(-1)?.technicalOwner).toBeNull();
    }
  });

  it('paginates and clamps out-of-range pages', async () => {
    const page1 = await applications.list({ page: 1, pageSize: 5 });
    expect(page1.items).toHaveLength(5);
    expect(page1.page).toBe(1);
    const beyond = await applications.list({ page: 99, pageSize: 5 });
    expect(beyond.page).toBe(Math.ceil(beyond.total / 5) - 1);
  });

  it('resolves list-item references to names', async () => {
    const result = await applications.list({ ...baseQuery, search: 'CIP' });
    const cip = result.items.find((item) => item.code === 'CIP');
    expect(cip?.businessUnit?.name).toBe('Teknoloji Platformları');
    expect(cip?.technicalOwner?.name).toBe('Jonas Berg');
  });

  it('throws NotFoundError for unknown ids', async () => {
    await expect(applications.getById('app-unknown')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns copies so callers cannot mutate repository state', async () => {
    const first = await applications.getById('app-payment-gateway');
    first.name = 'Mutated';
    const second = await applications.getById('app-payment-gateway');
    expect(second.name).toBe('Ödeme Geçidi');
  });
});

describe('MockConnectionRepository', () => {
  const { connections } = createMockRepositories();

  it('splits dependencies by direction', async () => {
    const { outgoing, incoming } =
      await connections.getApplicationDependencies('app-customer-identity');
    expect(outgoing.every((d) => d.sourceApplicationId === 'app-customer-identity')).toBe(true);
    expect(incoming.every((d) => d.targetApplicationId === 'app-customer-identity')).toBe(true);
    expect(incoming.map((d) => d.sourceApplicationId)).toContain('app-customer-portal');
  });
});

describe('MockProjectRepository', () => {
  const { projects } = createMockRepositories();

  it('lists projects affecting an application with the impact', async () => {
    const links = await projects.listByApplication('app-loyalty-engine');
    expect(links).toHaveLength(1);
    expect(links[0]?.impact.impactType).toBe('creates');
    expect(links[0]?.project.projectManager?.name).toBe('Lucas Moreau');
  });
});

describe('portfolio read models', () => {
  const repositories = createMockRepositories();

  it('summarises teams with ownership counts', async () => {
    const summaries = await repositories.teams.listSummaries();
    const platform = summaries.find((t) => t.id === 'team-platform');
    expect(platform?.manager?.name).toBe('Aylin Demir');
    expect(platform?.applicationCount).toBe(2);
    expect(platform?.projectCount).toBe(3);
  });

  it('summarises technologies with usage counts', async () => {
    const summaries = await repositories.technologies.listSummaries();
    expect(summaries.find((t) => t.id === 'tech-oracle')?.applicationCount).toBe(4);
  });

  it('filters projects by delivery team', async () => {
    const result = await repositories.projects.list({
      teamId: 'team-commerce',
      page: 0,
      pageSize: 50,
    });
    expect(result.items.map((p) => p.code).sort()).toEqual(['LBR', 'LPL']);
  });

  it('builds the portfolio overview', async () => {
    const overview = await repositories.governance.getPortfolioOverview();
    expect(overview.applications.total).toBe(17);
    expect(overview.attention.length).toBeGreaterThan(0);
  });
});
