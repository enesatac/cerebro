import { describe, expect, it, vi } from 'vitest';
import {
  toApplicationFormValues,
  toApplicationInput,
} from '@/domains/applications/schemas/applicationForm';
import { ForbiddenError, UnauthenticatedError, ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { afterWrites } from './persistence';

const ADMIN = 'user-can-ozturk';
const VIEWER = 'user-elif-kaya';

async function applicationInput(
  repos: ReturnType<typeof createMockRepositories>,
  id = 'app-payment-gateway',
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
    await expect(repos.risks.remove('risk-pay-db-support')).rejects.toBeInstanceOf(ForbiddenError);
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

describe('application writes', () => {
  it('creates with a slug id and audit stamped with the acting person', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const input = await applicationInput(repos);
    const created = await repos.applications.create({
      ...input,
      name: 'Payment Gateway Next',
      code: 'PAYGW2',
    });
    expect(created.id).toBe('app-payment-gateway-next');
    expect(created.audit.createdBy).toBe('person-can-ozturk');
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
      'app-legacy-booking-console',
      await applicationInput(repos, 'app-legacy-booking-console'),
    );
    expect(updated.audit.lastReviewedBy).toBe('person-can-ozturk');
    expect(updated.audit.createdAt).toBe('2016-04-18T09:00:00Z');
  });

  it('round-trips an application through the form without losing data', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    for (const id of [
      'app-customer-identity',
      'app-expense-management',
      'app-management-reporting-hub',
    ]) {
      const original = await repos.applications.getById(id);
      const { id: _id, audit: _audit, ...expected } = original;
      expect(toApplicationInput(toApplicationFormValues(original))).toEqual(expected);
    }
  });

  it('reports and applies the deletion cascade', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const impact = await repos.applications.getDeletionImpact('app-payment-gateway');
    expect(impact.references).toEqual(
      expect.arrayContaining([
        { label: 'proje', count: 1 },
        { label: 'bağımlılık', count: 4 },
      ]),
    );
    await repos.applications.remove('app-payment-gateway');
    expect(
      (await repos.connections.listDependencies()).some(
        (d) => d.targetApplicationId === 'app-payment-gateway',
      ),
    ).toBe(false);
    expect(
      (await repos.projects.getById('prj-payment-modernisation')).applicationImpacts.map(
        (i) => i.applicationId,
      ),
    ).not.toContain('app-payment-gateway');
    expect((await repos.risks.getById('risk-pay-single-acquirer')).relatedApplicationIds).toEqual(
      [],
    );
  });
});

describe('business rules', () => {
  it('blocks deleting a technology that is in use, allows an unused one', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    expect((await repos.technologies.getDeletionImpact('tech-oracle')).blockedReason).toMatch(
      /4 uygulama tarafından kullanılıyor/,
    );
    await expect(repos.technologies.remove('tech-oracle')).rejects.toBeInstanceOf(ValidationError);
    await repos.technologies.remove('tech-playwright').catch(() => undefined);
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
        sourceApplicationId: 'app-api-gateway',
        targetApplicationId: 'app-api-gateway',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repos.connections.dependencies.create({
        ...base,
        sourceApplicationId: 'app-oms-missing',
        targetApplicationId: 'app-api-gateway',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('requires risks to be linked to something', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const risk = await repos.risks.getById('risk-pay-db-support');
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
    const other = await repos.users.getById('user-selin-aydin');
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
    await expect(repos.auth.signIn('user-nadia-petrova')).rejects.toBeInstanceOf(ValidationError);
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
