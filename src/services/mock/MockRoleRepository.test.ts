import { describe, expect, it } from 'vitest';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { ROLE, USER } from './data/ids';

describe('roles and privileges', () => {
  it('creates a role with implied levels and applies it to the next request', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const role = await repos.roles.create({
      name: 'Finans iş birimi',
      description: '',
      privileges: ['projects:delete', 'demands:edit'],
    });
    expect(role.privileges).toEqual([
      'projects:view',
      'projects:edit',
      'projects:delete',
      'demands:view',
      'demands:edit',
    ]);
    await expect(
      repos.roles.create({ name: 'finans İŞ BİRİMİ', description: '', privileges: [] }),
    ).rejects.toMatchObject({ field: 'name' });

    // Tom (manager) cannot change projects until he holds the new role.
    const tom = await repos.users.getById(USER.tomBrennan);
    await repos.auth.signIn(USER.tomBrennan);
    await expect(repos.projects.remove(1)).rejects.toThrow(ForbiddenError);
    await repos.auth.signIn(USER.canOzturk);
    await repos.users.update(tom.id, { ...tom, roleIds: [...tom.roleIds, role.id] });
    await repos.auth.signIn(USER.tomBrennan);
    const session = await repos.auth.getSession();
    expect(session?.roleNames).toEqual(['Birim / ekip yöneticisi', 'Finans iş birimi']);
    expect(session?.privileges).toContain('projects:delete');
  });

  it('protects the system role and roles in use', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const system = await repos.roles.getById(ROLE.systemAdmin);
    await expect(repos.roles.update(system.id, { ...system, privileges: [] })).rejects.toThrow(
      ValidationError,
    );
    await expect(repos.roles.remove(ROLE.systemAdmin)).rejects.toThrow(/silinemez/);
    expect((await repos.roles.getDeletionImpact(ROLE.employee)).references).toEqual([
      { label: 'kullanıcı', count: 2 },
    ]);
    await expect(repos.roles.remove(ROLE.employee)).rejects.toThrow(/atanmış/);
    await repos.roles.remove(ROLE.auditor);
    expect((await repos.roles.list()).map((r) => r.id)).not.toContain(ROLE.auditor);
  });

  it('enforces screen privileges on writes and lets only role holders manage roles', async () => {
    const repos = createMockRepositories({ signedInAs: USER.zeynepCelik });
    // Portfolio office: edits projects, cannot touch users or roles.
    await expect(repos.users.list()).rejects.toThrow(ForbiddenError);
    await expect(
      repos.roles.create({ name: 'X', description: '', privileges: [] }),
    ).rejects.toThrow(ForbiddenError);
    const elif = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(elif.leaves.remove(1)).rejects.toThrow(ForbiddenError);
    // Elif's roles cannot see the user list, so the role list is closed to her too.
    await expect(elif.roles.list()).rejects.toThrow(ForbiddenError);
  });

  it('only returns search results from screens the user may view', async () => {
    const tom = createMockRepositories({ signedInAs: USER.tomBrennan });
    const kinds = async (repos: typeof tom) =>
      new Set((await repos.search.search({ term: 'a', limit: 100 })).map((r) => r.kind));
    expect(await kinds(tom)).toContain('team');
    // İş birimi kullanıcısı + Çalışan include teams; take a role without them instead.
    const bu = createMockRepositories({ signedInAs: USER.canOzturk });
    const elifAccount = await bu.users.getById(USER.elifKaya);
    await bu.users.update(USER.elifKaya, { ...elifAccount, roleIds: [ROLE.businessUnit] });
    await bu.auth.signIn(USER.elifKaya);
    expect([...(await kinds(bu))].sort()).toEqual(['application', 'project']);
  });
});
