import { describe, expect, it } from 'vitest';
import { seedTables } from '../database';

/**
 * Every reference in the seed data must resolve, ids must be unique, and no record may carry
 * anything that looks like a credential. Keeps the demo dataset trustworthy as it grows.
 */
const {
  applications,
  projects,
  dependencies,
  integrations,
  people,
  teams,
  technologies,
  businessUnits,
  risks,
  escalations,
  decisions,
} = seedTables;

const ids = (rows: readonly { id: number }[]) => new Set(rows.map((row) => row.id));
const personIds = ids(people);
const teamIds = ids(teams);
const technologyIds = ids(technologies);
const businessUnitIds = ids(businessUnits);
const applicationIds = ids(applications);
const projectIds = ids(projects);

function expectAll(values: (number | null)[], known: Set<number>, what: string) {
  const unknown = values.filter((value): value is number => value !== null && !known.has(value));
  expect(unknown, `unknown ${what}`).toEqual([]);
}

describe('mock data integrity', () => {
  it('has unique positive integer primary keys in every table, child tables included', () => {
    const portfolio = [...applications, ...projects];
    const tables: Record<string, readonly { id: number }[]> = {
      ...Object.fromEntries(Object.entries(seedTables).filter(([name]) => name !== 'masterData')),
      masterDataItems: seedTables.masterData.flatMap((list) => list.items),
      roleAssignments: portfolio.flatMap((row) => row.roles),
      teamAssignments: portfolio.flatMap((row) => row.teams),
      technologyUsages: applications.flatMap((a) => a.technologies),
      dataStores: applications.flatMap((a) => a.dataStores),
      repositories: applications.flatMap((a) => a.repositories),
      environments: applications.flatMap((a) => a.environments),
      documentationLinks: portfolio.flatMap((row) => row.documentation),
      milestones: projects.flatMap((p) => p.milestones),
      applicationImpacts: projects.flatMap((p) => p.applicationImpacts),
    };
    for (const [name, rows] of Object.entries(tables)) {
      expect(ids(rows).size, name).toBe(rows.length);
      expect(
        rows.every((row) => Number.isSafeInteger(row.id) && row.id > 0),
        name,
      ).toBe(true);
    }
  });

  it('resolves application references', () => {
    expectAll(
      applications.map((a) => a.businessUnitId),
      businessUnitIds,
      'business units',
    );
    expectAll(
      applications.flatMap((a) => a.roles.map((r) => r.personId)),
      personIds,
      'people',
    );
    expectAll(
      applications.flatMap((a) => a.teams.map((t) => t.teamId)),
      teamIds,
      'teams',
    );
    expectAll(
      applications.flatMap((a) => a.technologies.map((t) => t.technologyId)),
      technologyIds,
      'technologies',
    );
    expectAll(
      applications.flatMap((a) => a.dataStores.map((d) => d.technologyId)),
      technologyIds,
      'data store technologies',
    );
    expectAll(
      applications.flatMap((a) => [a.audit.createdBy, a.audit.updatedBy, a.audit.lastReviewedBy]),
      personIds,
      'audit people',
    );
  });

  it('resolves project references', () => {
    expectAll(
      projects.map((p) => p.businessUnitId),
      businessUnitIds,
      'business units',
    );
    expectAll(
      projects.flatMap((p) => p.roles.map((r) => r.personId)),
      personIds,
      'people',
    );
    expectAll(
      projects.flatMap((p) => p.teams.map((t) => t.teamId)),
      teamIds,
      'teams',
    );
    expectAll(
      projects.flatMap((p) => p.applicationImpacts.map((i) => i.applicationId)),
      applicationIds,
      'applications',
    );
  });

  it('resolves relationship endpoints', () => {
    expectAll(
      dependencies.flatMap((d) => [d.sourceApplicationId, d.targetApplicationId]),
      applicationIds,
      'dependency apps',
    );
    expectAll(
      integrations.flatMap((i) => [i.fromApplicationId, i.toApplicationId]),
      applicationIds,
      'integration apps',
    );
    expect(
      integrations.every((i) => i.toApplicationId !== null || i.externalPartyName !== null),
    ).toBe(true);
    expect(dependencies.every((d) => d.sourceApplicationId !== d.targetApplicationId)).toBe(true);
  });

  it('resolves operational knowledge references', () => {
    for (const row of [...risks, ...escalations, ...decisions]) {
      expectAll(row.relatedApplicationIds, applicationIds, `${row.id} applications`);
      expectAll(row.relatedProjectIds, projectIds, `${row.id} projects`);
    }
    expectAll(
      risks.map((r) => r.ownerId),
      personIds,
      'risk owners',
    );
    expectAll(
      escalations.flatMap((e) => [e.ownerId, e.raisedById]),
      personIds,
      'escalation people',
    );
    expectAll(
      escalations.map((e) => e.responsibleTeamId),
      teamIds,
      'escalation teams',
    );
    expectAll(
      decisions.flatMap((d) => d.decidedByIds),
      personIds,
      'decision makers',
    );
  });

  it('resolves team and business unit people', () => {
    expectAll(
      teams.flatMap((t) => [t.managerId, ...t.memberIds]),
      personIds,
      'team people',
    );
    expectAll(
      businessUnits.map((b) => b.headId),
      personIds,
      'business unit heads',
    );
  });

  it('contains no credential-like fields or values', () => {
    const serialised = JSON.stringify(seedTables).toLowerCase();
    for (const forbidden of [
      '"password',
      '"secret',
      '"token"',
      '"apikey',
      'api_key',
      'jdbc:',
      'begin private key',
    ]) {
      expect(serialised, forbidden).not.toContain(forbidden);
    }
  });
});
