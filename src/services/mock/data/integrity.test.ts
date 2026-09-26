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

const ids = (rows: { id: string }[]) => new Set(rows.map((row) => row.id));
const personIds = ids(people);
const teamIds = ids(teams);
const technologyIds = ids(technologies);
const businessUnitIds = ids(businessUnits);
const applicationIds = ids(applications);
const projectIds = ids(projects);

function expectAll(values: (string | null)[], known: Set<string>, what: string) {
  const unknown = values.filter((value): value is string => value !== null && !known.has(value));
  expect(unknown, `unknown ${what}`).toEqual([]);
}

describe('mock data integrity', () => {
  it('has unique ids per table', () => {
    for (const [name, rows] of Object.entries(seedTables)) {
      if (name === 'masterData') continue;
      expect(ids(rows as { id: string }[]).size, name).toBe(rows.length);
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
