import { z } from 'zod';
import {
  childRowId,
  emptyToNull,
  idText,
  optionalDate,
  optionalWholeNumber,
  requiredChoice,
  requiredDate,
  requiredText,
  secretFreeText,
  toId,
  toIdOrNull,
  toNumberOrNull,
} from '@/lib/validation';
import type { EntityId } from '@/domains/shared/types';
import type { Contract, ContractInput } from '../types';

const amount = z
  .string()
  .trim()
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0, 'Tutar girin.');

const paymentSchema = z
  .object({
    id: childRowId,
    description: secretFreeText('Açıklama', 200),
    dueDate: requiredDate('Vade'),
    amount,
    status: requiredChoice('bir durum'),
    invoiceNumber: secretFreeText('Fatura numarası', 60),
    paidDate: optionalDate,
  })
  .refine((p) => p.status !== 'paid' || p.paidDate !== '', {
    message: 'Ödenen taksitin ödeme tarihini girin.',
    path: ['paidDate'],
  });

export const contractFormSchema = z
  .object({
    title: requiredText('Başlık'),
    projectId: requiredChoice('bir proje'),
    vendorId: requiredChoice('bir tedarikçi'),
    type: requiredChoice('bir sözleşme türü'),
    status: requiredChoice('bir durum'),
    description: secretFreeText('Kapsam', 4000),
    ownerId: z.string(),
    purchaseOrderNumber: secretFreeText('Sipariş numarası', 60),
    signedDate: optionalDate,
    startDate: optionalDate,
    endDate: optionalDate,
    noticePeriodDays: optionalWholeNumber('İhbar süresi', { min: 0, max: 730 }),
    autoRenewal: z.boolean(),
    totalValue: optionalWholeNumber('Bedel'),
    currency: requiredChoice('bir para birimi'),
    billingFrequency: requiredChoice('bir faturalama sıklığı'),
    relatedApplicationIds: z.array(z.string()),
    payments: z.array(paymentSchema),
  })
  .superRefine((values, context) => {
    const issue = (path: (string | number)[], message: string) =>
      context.addIssue({ code: 'custom', path, message });
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      issue(['endDate'], 'Bitiş başlangıçtan önce olamaz.');
    }
    if (values.status === 'active' && !values.startDate) {
      issue(['startDate'], 'Yürürlükteki sözleşmenin başlangıç tarihi olmalıdır.');
    }
    if (values.noticePeriodDays && !values.endDate) {
      issue(['endDate'], 'İhbar süresi için bitiş tarihi gereklidir.');
    }
    const scheduled = values.payments
      .filter((p) => p.status !== 'cancelled')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (values.totalValue && scheduled > Number(values.totalValue)) {
      issue(['payments'], 'Ödeme planı toplamı sözleşme bedelini aşamaz.');
    }
  });

export type ContractFormValues = z.infer<typeof contractFormSchema>;
export type PaymentFormValues = ContractFormValues['payments'][number];

export const emptyPayment = (): PaymentFormValues => ({
  id: null,
  description: '',
  dueDate: '',
  amount: '',
  status: 'planned',
  invoiceNumber: '',
  paidDate: '',
});

const text = (value: number | null) => (value === null ? '' : String(value));

/** Existing contract, or a new one for the project it is opened from. */
export function toContractFormValues(
  contract?: Contract,
  prefill: { projectId?: EntityId | null } = {},
): ContractFormValues {
  return {
    title: contract?.title ?? '',
    projectId: idText(contract?.projectId ?? prefill.projectId),
    vendorId: idText(contract?.vendorId),
    type: contract?.type ?? '',
    status: contract?.status ?? 'draft',
    description: contract?.description ?? '',
    ownerId: idText(contract?.ownerId),
    purchaseOrderNumber: contract?.purchaseOrderNumber ?? '',
    signedDate: contract?.signedDate ?? '',
    startDate: contract?.startDate ?? '',
    endDate: contract?.endDate ?? '',
    noticePeriodDays: text(contract?.noticePeriodDays ?? null),
    autoRenewal: contract?.autoRenewal ?? false,
    totalValue: text(contract?.totalValue ?? null),
    currency: contract?.currency ?? 'TRY',
    billingFrequency: contract?.billingFrequency ?? 'one-time',
    relatedApplicationIds: (contract?.relatedApplicationIds ?? []).map(String),
    payments: (contract?.payments ?? []).map((p) => ({
      id: p.id,
      description: p.description,
      dueDate: p.dueDate,
      amount: String(p.amount),
      status: p.status,
      invoiceNumber: p.invoiceNumber,
      paidDate: p.paidDate ?? '',
    })),
  };
}

export const toContractInput = (values: ContractFormValues): ContractInput => ({
  title: values.title.trim(),
  projectId: toId(values.projectId),
  vendorId: toId(values.vendorId),
  type: values.type,
  status: values.status,
  description: values.description.trim(),
  ownerId: toIdOrNull(values.ownerId),
  purchaseOrderNumber: values.purchaseOrderNumber.trim(),
  signedDate: emptyToNull(values.signedDate),
  startDate: emptyToNull(values.startDate),
  endDate: emptyToNull(values.endDate),
  noticePeriodDays: toNumberOrNull(values.noticePeriodDays),
  autoRenewal: values.autoRenewal,
  totalValue: toNumberOrNull(values.totalValue),
  currency: values.currency,
  billingFrequency: values.billingFrequency,
  relatedApplicationIds: values.relatedApplicationIds.map(toId),
  payments: values.payments.map((p) => ({
    id: p.id,
    description: p.description.trim(),
    dueDate: p.dueDate,
    amount: Number(p.amount),
    status: p.status,
    invoiceNumber: p.invoiceNumber.trim(),
    paidDate: p.status === 'paid' ? emptyToNull(p.paidDate) : null,
  })),
});
