import type {
  ContractRepository,
  VendorRepository,
} from '@/domains/contracts/api/ContractRepository';
import type { Contract, ContractInput, Vendor, VendorInput } from '@/domains/contracts/types';
import type { DeletionImpact } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { isHttpUrl, looksLikeSecret, NO_SECRETS_MESSAGE } from '@/lib/validation';
import { attachmentsOnlyImpact, deleteAttachmentsOf } from './cascade';
import type { MockDatabase } from './database';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
import { copy, findOrThrow } from './query';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertText = (value: string, field: string, max: number, label: string) => {
  if (value.length > max) {
    throw new ValidationError(`${label} en fazla ${max} karakter olabilir.`, field);
  }
  if (looksLikeSecret(value)) throw new ValidationError(NO_SECRETS_MESSAGE, field);
};

const assertDate = (value: string | null, field: string) => {
  if (value !== null && !ISO_DATE.test(value)) {
    throw new ValidationError('Geçerli bir tarih girin.', field);
  }
};

export function createMockContractRepositories(db: MockDatabase, kit: WriteKit) {
  const validateContract = (input: ContractInput, previous?: Contract) => {
    if (!input.title.trim()) throw new ValidationError('Başlık zorunludur.', 'title');
    assertText(input.title, 'title', 200, 'Başlık');
    assertText(input.description, 'description', 4000, 'Kapsam');
    assertText(input.purchaseOrderNumber, 'purchaseOrderNumber', 60, 'Sipariş numarası');
    kit.assertRefs([input.projectId], db.projects, 'proje', 'projectId');
    kit.assertRefs([input.vendorId], db.vendors, 'tedarikçi', 'vendorId');
    kit.assertRefs([input.ownerId], db.people, 'kişi', 'ownerId');
    kit.assertRefs(
      input.relatedApplicationIds,
      db.applications,
      'uygulama',
      'relatedApplicationIds',
    );
    assertCodeChecks(db, codeChecks.contract(input), previous ? codeChecks.contract(previous) : []);
    assertDate(input.signedDate, 'signedDate');
    assertDate(input.startDate, 'startDate');
    assertDate(input.endDate, 'endDate');
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      throw new ValidationError('Bitiş başlangıçtan önce olamaz.', 'endDate');
    }
    if (input.status === 'active' && !input.startDate) {
      throw new ValidationError(
        'Yürürlükteki sözleşmenin başlangıç tarihi olmalıdır.',
        'startDate',
      );
    }
    if (
      input.noticePeriodDays !== null &&
      (!Number.isInteger(input.noticePeriodDays) || input.noticePeriodDays < 0)
    ) {
      throw new ValidationError('İhbar süresi gün olarak girilmelidir.', 'noticePeriodDays');
    }
    if (input.noticePeriodDays && !input.endDate) {
      throw new ValidationError('İhbar süresi için bitiş tarihi gereklidir.', 'endDate');
    }
    if (input.totalValue !== null && (!Number.isFinite(input.totalValue) || input.totalValue < 0)) {
      throw new ValidationError('Bedel sıfır veya pozitif olmalıdır.', 'totalValue');
    }
    input.payments.forEach((payment, index) => {
      const field = `payments.${index}`;
      assertDate(payment.dueDate, `${field}.dueDate`);
      assertDate(payment.paidDate, `${field}.paidDate`);
      if (!(payment.amount > 0)) {
        throw new ValidationError('Tutar sıfırdan büyük olmalıdır.', `${field}.amount`);
      }
      if (payment.status === 'paid' && !payment.paidDate) {
        throw new ValidationError('Ödenen taksitin ödeme tarihini girin.', `${field}.paidDate`);
      }
      assertText(payment.description, `${field}.description`, 200, 'Açıklama');
      assertText(payment.invoiceNumber, `${field}.invoiceNumber`, 60, 'Fatura numarası');
    });
    const scheduled = input.payments
      .filter((p) => p.status !== 'cancelled')
      .reduce((sum, p) => sum + p.amount, 0);
    if (input.totalValue !== null && scheduled > input.totalValue) {
      throw new ValidationError('Ödeme planı toplamı sözleşme bedelini aşamaz.', 'payments');
    }
  };

  const store = (input: ContractInput, id: number, existing: Contract['payments'] = []) => ({
    ...copy(input),
    title: input.title.trim(),
    description: input.description.trim(),
    purchaseOrderNumber: input.purchaseOrderNumber.trim(),
    relatedApplicationIds: [...new Set(input.relatedApplicationIds)],
    payments: kit
      .withIds(input.payments, 'contractPayments', existing)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    id,
    code: `SZL-${String(id).padStart(4, '0')}`,
  });

  const contracts: ContractRepository = {
    async list(query = {}) {
      await kit.begin('contracts:view');
      return copy(
        db.contracts
          .filter(
            (c) =>
              (query.projectId === undefined || c.projectId === query.projectId) &&
              (query.vendorId === undefined || c.vendorId === query.vendorId),
          )
          .sort((a, b) => (b.startDate ?? '9999').localeCompare(a.startDate ?? '9999')),
      );
    },
    async getById(id) {
      await kit.begin('contracts:view');
      return copy(findOrThrow(db.contracts, id, 'Sözleşme'));
    },
    async create(input) {
      const user = await kit.begin('contracts:edit');
      validateContract(input);
      const contract: Contract = {
        ...store(input, kit.nextId('contracts')),
        audit: kit.newAudit(user),
      };
      db.contracts.push(contract);
      return copy(contract);
    },
    async update(id, input) {
      const user = await kit.begin('contracts:edit');
      const current = findOrThrow(db.contracts, id, 'Sözleşme');
      validateContract(input, current);
      return copy(
        replaceRow(db.contracts, {
          ...store(input, id, current.payments),
          audit: kit.touch(current.audit, user),
        }),
      );
    },
    async remove(id) {
      await kit.begin('contracts:delete');
      findOrThrow(db.contracts, id, 'Sözleşme');
      deleteAttachmentsOf(db, { type: 'contract', id });
      removeRow(db.contracts, id);
    },
    async getDeletionImpact(id) {
      await kit.begin('contracts:view');
      findOrThrow(db.contracts, id, 'Sözleşme');
      return attachmentsOnlyImpact(db, { type: 'contract', id });
    },
  };

  const validateVendor = (input: VendorInput, excludeId: number | null) => {
    if (!input.name.trim()) throw new ValidationError('Firma adı zorunludur.', 'name');
    kit.assertUnique(
      db.vendors,
      input.name,
      (v) => v.name,
      excludeId,
      `"${input.name.trim()}" adında bir tedarikçi zaten var.`,
      'name',
    );
    if (input.taxNumber && !/^\d{10,11}$/.test(input.taxNumber)) {
      throw new ValidationError('Vergi numarası 10 veya 11 haneli olmalıdır.', 'taxNumber');
    }
    if (input.contactEmail && !EMAIL.test(input.contactEmail)) {
      throw new ValidationError('Geçerli bir e-posta adresi girin.', 'contactEmail');
    }
    if (input.website && !isHttpUrl(input.website)) {
      throw new ValidationError('Tam bir http(s) adresi girin.', 'website');
    }
    assertText(input.notes, 'notes', 1000, 'Not');
  };

  const vendorImpact = (id: number): DeletionImpact => {
    const used = db.contracts.filter((c) => c.vendorId === id).length;
    return {
      references: used > 0 ? [{ label: 'sözleşme', count: used }] : [],
      blockedReason:
        used > 0 ? 'Bu tedarikçinin sözleşmeleri var. Önce sözleşmeleri silin veya taşıyın.' : null,
    };
  };

  const cleanVendor = (input: VendorInput): VendorInput => ({
    name: input.name.trim(),
    taxNumber: input.taxNumber.trim(),
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    contactPhone: input.contactPhone.trim(),
    website: input.website.trim(),
    notes: input.notes.trim(),
  });

  const vendors: VendorRepository = {
    async list() {
      await kit.begin('contracts:view');
      return copy([...db.vendors].sort((a, b) => a.name.localeCompare(b.name, 'tr')));
    },
    async create(input) {
      const user = await kit.begin('contracts:edit');
      validateVendor(input, null);
      const vendor: Vendor = {
        ...cleanVendor(input),
        id: kit.nextId('vendors'),
        audit: kit.newAudit(user),
      };
      db.vendors.push(vendor);
      return copy(vendor);
    },
    async update(id, input) {
      const user = await kit.begin('contracts:edit');
      const current = findOrThrow(db.vendors, id, 'Tedarikçi');
      validateVendor(input, id);
      return copy(
        replaceRow(db.vendors, {
          ...current,
          ...cleanVendor(input),
          audit: kit.touch(current.audit, user),
        }),
      );
    },
    async remove(id) {
      await kit.begin('contracts:delete');
      findOrThrow(db.vendors, id, 'Tedarikçi');
      const { blockedReason } = vendorImpact(id);
      if (blockedReason) throw new ValidationError(blockedReason);
      removeRow(db.vendors, id);
    },
    async getDeletionImpact(id) {
      await kit.begin('contracts:view');
      findOrThrow(db.vendors, id, 'Tedarikçi');
      return vendorImpact(id);
    },
  };

  return { contracts, vendors };
}
