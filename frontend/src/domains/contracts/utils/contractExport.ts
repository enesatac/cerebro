import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import type { EntityId } from '@/domains/shared/types';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import type { Contract, ContractPayment, Vendor } from '../types';
import { noticeDeadline, paymentSummary } from './contractSchedule';

export interface ContractExportNames {
  project: (id: EntityId) => string;
  applications: (ids: readonly EntityId[]) => string;
  person: (id: EntityId | null) => string | undefined;
  vendor: (id: EntityId) => string | undefined;
}

/** Contracts and their payment plans as two sheets, the same wherever contracts are exported. */
export function contractSheets(
  contracts: readonly Contract[],
  masterData: Pick<MasterDataIndex, 'label'>,
  names: ContractExportNames,
  { title, subtitle }: { title: string; subtitle?: string },
): SheetSpec[] {
  const payments = contracts.flatMap((contract) =>
    contract.payments.map((payment) => ({ contract, payment })),
  );
  return [
    sheet<Contract>({
      name: 'Sözleşmeler',
      title,
      subtitle,
      rows: contracts,
      columns: [
        { header: 'Kod', value: (c) => c.code },
        { header: 'Başlık', value: (c) => c.title, width: 40 },
        { header: 'Proje', value: (c) => names.project(c.projectId) },
        { header: 'Tedarikçi', value: (c) => names.vendor(c.vendorId) },
        { header: 'Tür', value: (c) => masterData.label('contractTypes', c.type) },
        { header: 'Durum', value: (c) => masterData.label('contractStatuses', c.status) },
        { header: 'Sorumlu', value: (c) => names.person(c.ownerId) },
        { header: 'Sipariş no', value: (c) => c.purchaseOrderNumber },
        { header: 'İmza', value: (c) => c.signedDate, type: 'date' },
        { header: 'Başlangıç', value: (c) => c.startDate, type: 'date' },
        { header: 'Bitiş', value: (c) => c.endDate, type: 'date' },
        { header: 'İhbar süresi (gün)', value: (c) => c.noticePeriodDays, type: 'integer' },
        { header: 'Son bildirim', value: (c) => noticeDeadline(c), type: 'date' },
        { header: 'Otomatik yenileme', value: (c) => c.autoRenewal },
        { header: 'Bedel', value: (c) => c.totalValue, type: 'decimal' },
        { header: 'Para birimi', value: (c) => c.currency },
        {
          header: 'Faturalama',
          value: (c) => masterData.label('billingFrequencies', c.billingFrequency),
        },
        { header: 'Ödenen', value: (c) => paymentSummary(c).paid, type: 'decimal' },
        { header: 'Faturalanan', value: (c) => paymentSummary(c).invoiced, type: 'decimal' },
        { header: 'Kalan', value: (c) => paymentSummary(c).remaining, type: 'decimal' },
        { header: 'İlgili uygulamalar', value: (c) => names.applications(c.relatedApplicationIds) },
        { header: 'Kapsam', value: (c) => c.description, width: 50 },
      ],
    }),
    sheet<{ contract: Contract; payment: ContractPayment }>({
      name: 'Ödeme planı',
      title: `${title} — ödeme planı`,
      subtitle,
      rows: payments,
      columns: [
        { header: 'Sözleşme', value: (r) => r.contract.code },
        { header: 'Başlık', value: (r) => r.contract.title, width: 36 },
        { header: 'Tedarikçi', value: (r) => names.vendor(r.contract.vendorId) },
        { header: 'Açıklama', value: (r) => r.payment.description },
        { header: 'Vade', value: (r) => r.payment.dueDate, type: 'date' },
        { header: 'Tutar', value: (r) => r.payment.amount, type: 'decimal' },
        { header: 'Para birimi', value: (r) => r.contract.currency },
        {
          header: 'Durum',
          value: (r) => masterData.label('paymentStatuses', r.payment.status),
        },
        { header: 'Fatura no', value: (r) => r.payment.invoiceNumber },
        { header: 'Ödeme tarihi', value: (r) => r.payment.paidDate, type: 'date' },
      ],
    }),
  ];
}

export const vendorSheet = (vendors: readonly Vendor[], contractCount: (id: number) => number) =>
  sheet<Vendor>({
    name: 'Tedarikçiler',
    title: 'Tedarikçiler',
    rows: vendors,
    columns: [
      { header: 'Firma', value: (v) => v.name },
      { header: 'Vergi no', value: (v) => v.taxNumber },
      { header: 'İletişim kişisi', value: (v) => v.contactName },
      { header: 'E-posta', value: (v) => v.contactEmail },
      { header: 'Telefon', value: (v) => v.contactPhone },
      { header: 'Web sitesi', value: (v) => v.website, type: 'link' },
      { header: 'Sözleşme sayısı', value: (v) => contractCount(v.id), type: 'integer' },
    ],
  });
