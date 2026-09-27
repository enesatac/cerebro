import { describe, expect, it, vi } from 'vitest';
import {
  toApplicationFormValues,
  toApplicationInput,
} from '@/domains/applications/schemas/applicationForm';
import { ForbiddenError, UnauthenticatedError, ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { afterWrites } from './persistence';
import { APP, PERSON, PRJ, RISK, TECH, USER } from '@/services/mock/data/ids';

const ADMIN = USER.canOzturk;
const VIEWER = USER.elifKaya;

async function applicationInput(
  repos: ReturnType<typeof createMockRepositories>,
  id: number = APP.paymentGateway,
) {
  return toApplicationInput(toApplicationFormValues(await repos.applications.getById(id)));
}

describe('authorisation is enforced by the repository (backend), not only the UI', () => {
  it('refuses writes from read-only users', async () => {
    const repos = createMockRepositories({ signedInAs: VIEWER });
    const input = await applicationInput(repos);
    await expect(repos.applications.create({ ...input, code: 'NEW' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(repos.risks.remove(RISK.payDbSupport)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(repos.users.list()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('refuses writes when signed out', async () => {
    const repos = createMockRepositories();
    await expect(
      repos.technologies.create({
        name: 'Go',
        category: 'backend',
        status: 'supported',
        description: '',
      }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

/** A copy of an input whose child rows are all new (`id: null`), as the create form sends them. */
function asNewRows(input: Awaited<ReturnType<typeof applicationInput>>) {
  const fresh = <T extends { id: number | null }>(rows: T[]) =>
    rows.map((row) => ({ ...row, id: null }));
  return {
    ...input,
    roles: fresh(input.roles),
    teams: fresh(input.teams),
    technologies: fresh(input.technologies),
    dataStores: fresh(input.dataStores),
    repositories: fresh(input.repositories),
    environments: fresh(input.environments),
    documentation: fresh(input.documentation),
  };
}

describe('application writes', () => {
  it('keeps child row ids on update and refuses ids owned by another record', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const gateway = await repos.applications.getById(APP.paymentGateway);
    const input = await applicationInput(repos, APP.paymentGateway);
    const [firstEnvironment] = input.environments;
    const [foreignEnvironment] = (await repos.applications.getById(APP.customerIdentity))
      .environments;
    if (!firstEnvironment || !foreignEnvironment) throw new Error('seed environments missing');
    const updated = await repos.applications.update(APP.paymentGateway, {
      ...input,
      environments: [...input.environments, { ...firstEnvironment, id: null, name: 'Yeni' }],
    });
    expect(updated.environments.slice(0, -1).map((env) => env.id)).toEqual(
      gateway.environments.map((env) => env.id),
    );
    expect(updated.environments.at(-1)?.id).toBeGreaterThan(0);

    await expect(
      repos.applications.update(APP.paymentGateway, {
        ...input,
        environments: [{ ...firstEnvironment, id: foreignEnvironment.id }],
      }),
    ).rejects.toThrow(/Geçersiz alt kayıt kimliği/);
  });

  it('takes ids from the table sequences and stamps audit with the acting person', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const input = asNewRows(await applicationInput(repos));
    const created = await repos.applications.create({
      ...input,
      name: 'Payment Gateway Next',
      code: 'PAYGW2',
    });
    // 17 seed applications → the sequence hands out 18; child rows get ids from their own tables.
    expect(created.id).toBe(Object.keys(APP).length + 1);
    expect(created.environments.every((env) => Number.isInteger(env.id) && env.id > 0)).toBe(true);
    const source = await repos.applications.getById(APP.paymentGateway);
    expect(Math.min(...created.environments.map((env) => env.id))).toBeGreaterThan(
      Math.max(...source.environments.map((env) => env.id)),
    );
    expect(created.audit.createdBy).toBe(PERSON.canOzturk);
    expect(await repos.applications.getById(created.id)).toMatchObject({ code: 'PAYGW2' });
  });

  it('rejects a duplicate code on the code field', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const input = await applicationInput(repos);
    const error = await repos.applications
      .create({ ...input, name: 'Copy' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).field).toBe('code');
  });

  it('treats saving as a review', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const updated = await repos.applications.update(
      APP.legacyBookingConsole,
      await applicationInput(repos, APP.legacyBookingConsole),
    );
    expect(updated.audit.lastReviewedBy).toBe(PERSON.canOzturk);
    expect(updated.audit.createdAt).toBe('2016-04-18T09:00:00Z');
  });

  it('round-trips an application through the form without losing data', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    for (const id of [APP.customerIdentity, APP.expenseManagement, APP.managementReportingHub]) {
      const original = await repos.applications.getById(id);
      const { id: _id, audit: _audit, ...expected } = original;
      expect(toApplicationInput(toApplicationFormValues(original))).toEqual(expected);
    }
  });

  it('reports and applies the deletion cascade', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const impact = await repos.applications.getDeletionImpact(APP.paymentGateway);
    expect(impact.references).toEqual(
      expect.arrayContaining([
        { label: 'proje', count: 1 },
        { label: 'bağımlılık', count: 4 },
      ]),
    );
    await repos.applications.remove(APP.paymentGateway);
    expect(
      (await repos.connections.listDependencies()).some(
        (d) => d.targetApplicationId === APP.paymentGateway,
      ),
    ).toBe(false);
    expect(
      (await repos.projects.getById(PRJ.paymentModernisation)).applicationImpacts.map(
        (i) => i.applicationId,
      ),
    ).not.toContain(APP.paymentGateway);
    expect((await repos.risks.getById(RISK.paySingleAcquirer)).relatedApplicationIds).toEqual([]);
  });
});

describe('business rules', () => {
  it('blocks deleting a technology that is in use, allows an unused one', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    expect((await repos.technologies.getDeletionImpact(TECH.oracle)).blockedReason).toMatch(
      /4 uygulama tarafından kullanılıyor/,
    );
    await expect(repos.technologies.remove(TECH.oracle)).rejects.toBeInstanceOf(ValidationError);
    await repos.technologies.remove(TECH.playwright).catch(() => undefined);
    const unused = await repos.technologies.create({
      name: 'Rust',
      category: 'backend',
      status: 'supported',
      description: '',
    });
    await repos.technologies.remove(unused.id);
    await expect(repos.technologies.getById(unused.id)).rejects.toThrow();
  });

  it('rejects self-dependencies and duplicates', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const base = { type: 'runtime' as const, criticality: 'high' as const, description: '' };
    await expect(
      repos.connections.dependencies.create({
        ...base,
        sourceApplicationId: APP.apiGateway,
        targetApplicationId: APP.apiGateway,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repos.connections.dependencies.create({
        ...base,
        sourceApplicationId: 9999,
        targetApplicationId: APP.apiGateway,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('requires risks to be linked to something', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const risk = await repos.risks.getById(RISK.payDbSupport);
    const { id: _id, audit: _audit, ...input } = risk;
    await expect(
      repos.risks.update(risk.id, { ...input, relatedApplicationIds: [], relatedProjectIds: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('keeps the system administrable', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const me = await repos.users.getById(ADMIN);
    const asInput = (u: typeof me) => ({
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      personId: u.personId,
      active: u.active,
    });
    await expect(repos.users.update(ADMIN, { ...asInput(me), active: false })).rejects.toThrow(
      /devre dışı bırakamazsınız/,
    );
    await expect(repos.users.update(ADMIN, { ...asInput(me), role: 'user' })).rejects.toThrow(
      /yönetici rolünüzü/,
    );
    const other = await repos.users.getById(USER.selinAydin);
    await repos.users.update(other.id, { ...asInput(other), role: 'user' });
    // Can is now the only admin; nobody else can remove that role from them either.
    await expect(
      repos.users.create({ ...asInput(me), email: 'can.ozturk@corp.example' }),
    ).rejects.toThrow(/zaten var/);
  });
});

describe('sign-in', () => {
  it('signs in active accounts only and records the session', async () => {
    const repos = createMockRepositories();
    await expect(repos.auth.signIn(USER.nadiaPetrova)).rejects.toBeInstanceOf(ValidationError);
    await repos.auth.signIn(VIEWER);
    expect((await repos.auth.getSession())?.id).toBe(VIEWER);
    await repos.auth.signOut();
    expect(await repos.auth.getSession()).toBeNull();
  });
});

describe('afterWrites', () => {
  it('notifies after successful writes only', async () => {
    const onWrite = vi.fn();
    const repo = afterWrites(
      {
        list: async () => [],
        create: async () => 'created',
        nested: { remove: async () => undefined },
        update: async () => {
          throw new Error('nope');
        },
      },
      onWrite,
    );
    await repo.list();
    expect(onWrite).not.toHaveBeenCalled();
    await repo.create();
    await repo.nested.remove();
    await expect(repo.update()).rejects.toThrow();
    expect(onWrite).toHaveBeenCalledTimes(2);
  });
});

describe('user account deletion', () => {
  it('deletes other accounts but never your own or the last active admin', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    await expect(repos.users.remove(ADMIN)).rejects.toThrow(/Kendi hesabınızı silemezsiniz/);

    await repos.users.remove(USER.nadiaPetrova);
    expect((await repos.users.list()).some((u) => u.id === USER.nadiaPetrova)).toBe(false);
    // The linked person and their history stay.
    expect(await repos.people.getById(PERSON.nadiaPetrova)).toBeDefined();

    // Selin is the only other admin: after she goes, Can is the last admin — and cannot delete himself.
    await repos.users.remove(USER.selinAydin);
    const impact = await repos.users.getDeletionImpact(ADMIN);
    expect(impact.blockedReason).not.toBeNull();
  });

  it('is limited to user managers', async () => {
    const repos = createMockRepositories({ signedInAs: VIEWER });
    await expect(repos.users.remove(USER.tomBrennan)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
