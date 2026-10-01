import { describe, expect, it } from 'vitest';
import { toProjectFormValues, toProjectInput } from '@/domains/projects/schemas/projectForm';
import { NotFoundError } from '@/lib/errors';
import { APP, PERSON, PRJ, USER } from '@/services/mock/data/ids';
import { createMockRepositories } from './index';

const TODAY = '2026-10-01';

describe('person workload', () => {
  it('collects roles, team work, governance and upcoming leaves for one person', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const workload = await repos.people.getWorkload(PERSON.aylinDemir, TODAY);

    expect(workload.person.fullName).toBe('Aylin Demir');
    expect(workload.teams.map((t) => t.team.name)).toContain('Platform Mühendisliği');

    const notifications = workload.applications.find((a) => a.id === APP.notificationService);
    expect(notifications?.roles).toContain('technical-owner');
    expect(notifications?.viaTeams.map((t) => t.team.name)).toContain('Platform Mühendisliği');

    // Direct roles are listed before work that only comes through a team.
    const firstTeamOnly = workload.projects.findIndex((p) => p.roles.length === 0);
    const lastDirect = workload.projects.map((p) => p.roles.length > 0).lastIndexOf(true);
    expect(lastDirect).toBeLessThan(firstTeamOnly === -1 ? Infinity : firstTeamOnly);
    expect(workload.projects.some((p) => p.id === PRJ.notificationConsolidation)).toBe(true);

    expect(workload.escalations.length).toBeGreaterThan(0);
    expect(workload.escalations.every((e) => e.involvement.length > 0)).toBe(true);
    expect(workload.leaves.every((l) => l.endDate >= TODAY)).toBe(true);
    expect(workload.leaves.length).toBeGreaterThan(0);
  });

  it('reflects a new role assignment immediately', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const project = await repos.projects.getById(PRJ.notificationConsolidation);
    // Someone with no link to the project yet.
    const people = await repos.people.list();
    const workloads = await Promise.all(people.map((p) => repos.people.getWorkload(p.id, TODAY)));
    const outsider = workloads.find((w) => !w.projects.some((p) => p.id === project.id));
    if (!outsider) throw new Error('every seed person already works on the project');
    const input = toProjectInput(toProjectFormValues(project));
    await repos.projects.update(project.id, {
      ...input,
      roles: [...input.roles, { id: null, personId: outsider.person.id, role: 'analyst' }],
    });
    const after = await repos.people.getWorkload(outsider.person.id, TODAY);
    expect(after.projects.find((p) => p.id === project.id)?.roles).toEqual(['analyst']);
  });

  it('reports unknown people as not found', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(repos.people.getWorkload(999_999, TODAY)).rejects.toBeInstanceOf(NotFoundError);
  });
});
