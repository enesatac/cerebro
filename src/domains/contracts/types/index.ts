import type { AuditMetadata, Draft, EntityId, IsoDate, PersonId } from '@/domains/shared/types';

export type ContractId = EntityId;
export type VendorId = EntityId;

/**
 * A supplier the organisation buys from (a row of `vendors`). Contact details are business
 * contacts only — never credentials or bank details.
 */
export interface Vendor {
  id: VendorId;
  name: string;
  /** Tax number (VKN) used by procurement to identify the company. */
  taxNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  notes: string;
  audit: AuditMetadata;
}

export type VendorInput = Omit<Vendor, 'id' | 'audit'>;

/** Seed contract types; administrators can add more in master data (`contractTypes`). */
export const CONTRACT_TYPES = [
  'license',
  'subscription',
  'professional-services',
  'consulting',
  'outsourcing',
  'hardware',
  'maintenance-support',
  'other',
] as const;
export type ContractType = string;

/**
 * Lifecycle of a purchase (`contractStatuses`). System codes: an active contract has a start
 * date, a terminated one ends early.
 */
export const CONTRACT_STATUSES = [
  'draft',
  'in-procurement',
  'active',
  'expired',
  'terminated',
] as const;
export type ContractStatus = string;

export const BILLING_FREQUENCIES = ['one-time', 'monthly', 'quarterly', 'yearly'] as const;
export type BillingFrequency = string;

/** Status of one instalment (`paymentStatuses`); `paid` needs a payment date. */
export const PAYMENT_STATUSES = ['planned', 'invoiced', 'paid', 'cancelled'] as const;
export type PaymentStatus = string;

/** One instalment of the payment plan (a row of `contract_payments`). */
export interface ContractPayment {
  id: EntityId;
  description: string;
  dueDate: IsoDate;
  amount: number;
  status: PaymentStatus;
  invoiceNumber: string;
  paidDate: IsoDate | null;
}

/**
 * A purchase or contract made for a project (a row of `contracts`): who supplies what, for how
 * long, at what value, and how it is paid. The signed contract, offers and invoices are
 * attachments.
 */
export interface Contract {
  id: ContractId;
  /** Human-readable reference assigned by the server (`SZL-0007`). */
  code: string;
  title: string;
  projectId: EntityId;
  vendorId: VendorId;
  type: ContractType;
  status: ContractStatus;
  /** Scope: what is bought, service levels, quantities. */
  description: string;
  /** Who manages the contract on the organisation's side. */
  ownerId: PersonId | null;
  purchaseOrderNumber: string;
  signedDate: IsoDate | null;
  startDate: IsoDate | null;
  /** `null` for open-ended contracts. */
  endDate: IsoDate | null;
  /** Days before `endDate` by which termination or renewal must be notified. */
  noticePeriodDays: number | null;
  autoRenewal: boolean;
  totalValue: number | null;
  currency: string;
  billingFrequency: BillingFrequency;
  relatedApplicationIds: EntityId[];
  /** Ordered by due date. */
  payments: ContractPayment[];
  audit: AuditMetadata;
}

/** New payment rows are sent with `id: null`; the server assigns them. */
export type ContractInput = Omit<Contract, 'id' | 'code' | 'audit' | 'payments'> & {
  payments: Draft<ContractPayment>[];
};

export interface ContractQuery {
  projectId?: EntityId;
  vendorId?: VendorId;
}
