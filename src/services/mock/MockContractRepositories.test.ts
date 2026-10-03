import { describe, expect, it } from 'vitest';
import type { ContractInput } from '@/domains/contracts/types';
import { ForbiddenError, type ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { APP, CON, PERSON, PRJ, USER, VENDOR } from './data/ids';

const input = (overrides: Partial<ContractInput> = {}): ContractInput => ({
  title: 'Yük testi aracı lisansı',
  projectId: PRJ.opsResilience,
  vendorId: VENDOR.northwind,
  type: 'license',
  status: 'active',
  description: '',
  ownerId: PERSON.aylinDemir,
  purchaseOrderNumber: 'PO-2026-0999',
  signedDate: '2026-10-01',
  startDate: '2026-10-01',
  endDate: '2027-09-30',
  noticePeriodDays: 30,
  autoRenewal: false,
  totalValue: 100_000,
  currency: 'TRY',
  billingFrequency: 'quarterly',
  relatedApplicationIds: [APP.apiGateway],
  payments: [
    {
      id: null,
      description: '1. çeyrek',
      dueDate: '2026-10-15',
      amount: 25_000,
      status: 'planned',
      invoiceNumber: '',
      paidDate: null,
    },
  ],
  ...overrides,
});

describe('contract repository', () => {
  it('keeps commercial terms from roles without the contracts privilege', async () => {
    const elif = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(elif.contracts.list()).rejects.toThrow(ForbiddenError);
    const tom = createMockRepositories({ signedInAs: USER.tomBrennan });
    expect((await tom.contracts.list()).length).toBeGreaterThan(0);
    await expect(tom.contracts.create(input())).rejects.toThrow(ForbiddenError);
  });

  it('creates a contract with a code and payment ids, and keeps existing rows on update', async () => {
    const repos = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const created = await repos.contracts.create(input());
    expect(created.code).toBe(`SZL-00${CON.smsGateway + 1}`);
    const [first] = created.payments;
    if (!first) throw new Error('payment row missing');
    expect(first.id).toBeGreaterThan(0);
    const updated = await repos.contracts.update(created.id, {
      ...input(),
      payments: [
        { ...first, status: 'paid', paidDate: '2026-10-20', invoiceNumber: 'NW-1' },
        {
          id: null,
          description: '2. çeyrek',
          dueDate: '2027-01-15',
          amount: 25_000,
          status: 'planned',
          invoiceNumber: '',
          paidDate: null,
        },
      ],
    });
    expect(updated.payments.map((p) => p.id)[0]).toBe(first.id);
    expect(
      (await repos.contracts.list({ projectId: PRJ.opsResilience })).map((c) => c.id),
    ).toContain(created.id);
  });

  it('refuses inconsistent terms', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const field = (promise: Promise<unknown>) =>
      promise.then(
        () => null,
        (error: ValidationError) => error.field,
      );
    expect(await field(repos.contracts.create(input({ endDate: '2026-01-01' })))).toBe('endDate');
    expect(await field(repos.contracts.create(input({ status: 'active', startDate: null })))).toBe(
      'startDate',
    );
    expect(await field(repos.contracts.create(input({ totalValue: 10_000 })))).toBe('payments');
    expect(
      await field(
        repos.contracts.create(
          input({
            payments: [
              {
                id: null,
                description: '',
                dueDate: '2026-10-15',
                amount: 5,
                status: 'paid',
                invoiceNumber: '',
                paidDate: null,
              },
            ],
          }),
        ),
      ),
    ).toBe('payments.0.paidDate');
    expect(await field(repos.contracts.create(input({ description: 'password: hunter2' })))).toBe(
      'description',
    );
  });

  it('protects records that contracts depend on', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    await expect(repos.vendors.remove(VENDOR.northwind)).rejects.toThrow(/sözleşmeleri var/);
    await expect(repos.projects.remove(PRJ.opsResilience)).rejects.toThrow(/sözleşmeleri var/);
    await repos.applications.remove(APP.notificationService);
    expect((await repos.contracts.getById(CON.smsGateway)).relatedApplicationIds).toEqual([]);
    const vendor = await repos.vendors.create({
      name: 'Yeni Tedarikçi',
      taxNumber: '1234567890',
      contactName: '',
      contactEmail: 'satis@yeni.example',
      contactPhone: '',
      website: '',
      notes: '',
    });
    await expect(repos.vendors.create({ ...vendor, name: 'yeni tedarikçi' })).rejects.toMatchObject(
      { field: 'name' },
    );
    await repos.vendors.remove(vendor.id);
  });

  it('files contract documents under the contracts privilege', async () => {
    const tom = createMockRepositories({ signedInAs: USER.tomBrennan });
    const file = new File(['%PDF-1.4'], 'fatura.pdf', { type: 'application/pdf' });
    await expect(
      tom.attachments.upload({
        owner: { type: 'contract', id: CON.drSite },
        documentType: 'invoice',
        description: '',
        file,
        fileName: file.name,
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
