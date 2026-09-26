import { describe, expect, it } from 'vitest';
import {
  toApplicationFormValues,
  toApplicationInput,
} from '@/domains/applications/schemas/applicationForm';
import type { MasterDataItem, MasterDataListKey } from '@/domains/master-data/types';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';

const ADMIN = 'user-can-ozturk';
const VIEWER = 'user-elif-kaya';

async function itemsOf(repos: ReturnType<typeof createMockRepositories>, key: MasterDataListKey) {
  const lists = await repos.masterData.listAll();
  return lists.find((list) => list.key === key)?.items ?? [];
}

const custom = (code: string, label: string): MasterDataItem => ({
  code,
  label,
  description: '',
  variant: null,
  active: true,
});

describe('master data lists', () => {
  it('exposes every list with Turkish labels and usage counts', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const lifecycles = await itemsOf(repos, 'applicationLifecycles');
    expect(lifecycles.map((item) => item.label)).toContain('Aktif');
    const usage = await repos.masterData.getUsage('applicationLifecycles');
    expect(usage.active).toBeGreaterThan(0);
  });

  it('lets admins rename, recolour and reorder values', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const items = await itemsOf(repos, 'applicationLifecycles');
    const renamed = items
      .map((item) =>
        item.code === 'active' ? { ...item, label: 'Canlıda', variant: 'teal' as const } : item,
      )
      .reverse();
    await repos.masterData.update('applicationLifecycles', renamed);
    const saved = await itemsOf(repos, 'applicationLifecycles');
    expect(saved[0]?.code).toBe('retired');
    expect(saved.find((item) => item.code === 'active')).toMatchObject({
      label: 'Canlıda',
      variant: 'teal',
    });
  });

  it('adds custom values to extensible lists and lets records use them', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const items = await itemsOf(repos, 'applicationTypes');
    await repos.masterData.update('applicationTypes', [
      ...items,
      custom('mobile-app', 'Mobil uygulama'),
    ]);

    const app = await repos.applications.getById('app-payment-gateway');
    const input = toApplicationInput(toApplicationFormValues(app));
    await repos.applications.update(app.id, { ...input, type: 'mobile-app' });
    expect((await repos.applications.getById(app.id)).type).toBe('mobile-app');
    expect((await repos.masterData.getUsage('applicationTypes'))['mobile-app']).toBe(1);
  });

  it('protects system values, fixed lists and values in use', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const types = await itemsOf(repos, 'applicationTypes');

    await expect(
      repos.masterData.update(
        'applicationTypes',
        types.filter((item) => item.code !== 'saas-product'),
      ),
    ).rejects.toThrow(/Sistem değerleri silinemez/);
    await expect(
      repos.masterData.update(
        'applicationTypes',
        types.map((item) => (item.code === 'api-service' ? { ...item, active: false } : item)),
      ),
    ).rejects.toThrow(/pasife alınamaz/);

    const statuses = await itemsOf(repos, 'riskStatuses');
    await expect(
      repos.masterData.update('riskStatuses', [
        ...statuses,
        { ...custom('parked', 'Park'), variant: 'neutral' },
      ]),
    ).rejects.toThrow(/yeni değer eklenemez/);

    // A custom value in use can be deactivated but not removed.
    await repos.masterData.update('applicationTypes', [
      ...types,
      custom('mobile-app', 'Mobil uygulama'),
    ]);
    const app = await repos.applications.getById('app-payment-gateway');
    await repos.applications.update(app.id, {
      ...toApplicationInput(toApplicationFormValues(app)),
      type: 'mobile-app',
    });
    await expect(repos.masterData.update('applicationTypes', types)).rejects.toThrow(
      /1 kayıtta kullanılıyor/,
    );
    await repos.masterData.update('applicationTypes', [
      ...types,
      { ...custom('mobile-app', 'Mobil uygulama'), active: false },
    ]);
  });

  it('rejects duplicate labels and unknown or inactive codes on records', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const types = await itemsOf(repos, 'applicationTypes');
    await expect(
      repos.masterData.update('applicationTypes', [...types, custom('web-2', 'Web uygulaması')]),
    ).rejects.toBeInstanceOf(ValidationError);

    const app = await repos.applications.getById('app-payment-gateway');
    const input = toApplicationInput(toApplicationFormValues(app));
    await expect(
      repos.applications.update(app.id, { ...input, type: 'unknown-type' }),
    ).rejects.toThrow(/Geçersiz veya pasif değer/);

    // Deactivating a value keeps existing records valid, but new records cannot pick it.
    await repos.masterData.update('applicationTypes', [
      ...types.filter((item) => item.code !== 'mobile-app'),
      { ...custom('legacy-type', 'Eski tür'), active: true },
    ]);
    await repos.applications.update(app.id, { ...input, type: 'legacy-type' });
    await repos.masterData.update('applicationTypes', [
      ...types,
      { ...custom('legacy-type', 'Eski tür'), active: false },
    ]);
    await expect(
      repos.applications.update(app.id, { ...input, type: 'legacy-type', name: 'Ödeme Geçidi 2' }),
    ).resolves.toBeDefined();
    await expect(
      repos.applications.create({ ...input, code: 'NEWAPP', name: 'Yeni', type: 'legacy-type' }),
    ).rejects.toThrow(/Geçersiz veya pasif değer/);
  });

  it('is admin-only', async () => {
    const repos = createMockRepositories({ signedInAs: VIEWER });
    const items = await itemsOf(repos, 'applicationTypes');
    await expect(repos.masterData.update('applicationTypes', items)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      repos.people.create({
        fullName: 'Test Kişi',
        jobTitle: 'Analist',
        email: 'test@corp.example',
        businessUnitId: null,
        location: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('people and business units', () => {
  it('creates, renames and deletes an unreferenced person; lookups follow the rename', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const person = await repos.people.create({
      fullName: 'Deniz Yurt',
      jobTitle: 'Kurumsal Mimar',
      email: 'deniz.yurt@corp.example',
      businessUnitId: 'bu-technology',
      location: 'Ankara',
    });
    expect(person.id).toBe('person-deniz-yurt');
    await expect(repos.people.create({ ...person, fullName: 'Başka' })).rejects.toThrow(
      /zaten var/,
    );

    const jonas = await repos.people.getById('person-jonas-berg');
    await repos.people.update(jonas.id, { ...jonas, fullName: 'Jonas Berg-Aydın' });
    const list = await repos.applications.list({ page: 0, pageSize: 50 });
    expect(list.items.find((app) => app.id === 'app-customer-identity')?.technicalOwner?.name).toBe(
      'Jonas Berg-Aydın',
    );

    await repos.people.remove(person.id);
    expect((await repos.people.list()).some((p) => p.id === person.id)).toBe(false);
  });

  it('refuses to delete referenced people and business units in use', async () => {
    const repos = createMockRepositories({ signedInAs: ADMIN });
    const impact = await repos.people.getDeletionImpact('person-can-ozturk');
    expect(impact.blockedReason).not.toBeNull();
    expect(impact.references.length).toBeGreaterThan(0);
    await expect(repos.people.remove('person-can-ozturk')).rejects.toBeInstanceOf(ValidationError);

    await expect(repos.businessUnits.remove('bu-finance')).rejects.toThrow(/kullanılıyor/);
    const unit = await repos.businessUnits.create({
      code: 'LAB',
      name: 'Laboratuvar',
      description: '',
      headId: null,
    });
    await expect(
      repos.businessUnits.create({ code: 'LAB', name: 'Başka', description: '', headId: null }),
    ).rejects.toThrow(/kodu başka bir iş birimi/);
    await repos.businessUnits.remove(unit.id);
  });
});
