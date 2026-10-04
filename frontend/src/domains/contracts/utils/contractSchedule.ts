import { differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import type { IsoDate } from '@/domains/shared/types';
import { toIsoDate } from '@/lib/dates';
import type { Contract, ContractPayment } from '../types';

/** How far ahead dates count as "coming up". */
export const END_WARNING_DAYS = 90;
export const NOTICE_WARNING_DAYS = 30;

const days = (from: IsoDate, to: IsoDate) => differenceInCalendarDays(parseISO(to), parseISO(from));

/** The last day to give notice (terminate or renegotiate) before the contract ends or renews. */
export function noticeDeadline(contract: Pick<Contract, 'endDate' | 'noticePeriodDays'>) {
  if (!contract.endDate || !contract.noticePeriodDays) return null;
  return toIsoDate(subDays(parseISO(contract.endDate), contract.noticePeriodDays));
}

export type ContractAlertKind = 'expired-active' | 'ending' | 'notice' | 'overdue-payment';

export interface ContractAlert {
  kind: ContractAlertKind;
  tone: 'danger' | 'warning';
  date: IsoDate;
  message: string;
}

const isOpenPayment = (p: ContractPayment) => p.status === 'planned' || p.status === 'invoiced';

export const overduePayments = (contract: Pick<Contract, 'payments'>, today: IsoDate) =>
  contract.payments.filter((p) => isOpenPayment(p) && p.dueDate < today);

/**
 * What needs attention on an active contract: past its end but still marked active, ending soon,
 * a notice deadline coming up (especially with auto-renewal), and unpaid instalments past due.
 */
export function contractAlerts(contract: Contract, today: IsoDate): ContractAlert[] {
  const alerts: ContractAlert[] = [];
  const live = contract.status === 'active';
  if (live && contract.endDate) {
    const left = days(today, contract.endDate);
    if (left < 0) {
      alerts.push({
        kind: 'expired-active',
        tone: 'danger',
        date: contract.endDate,
        message: 'Bitiş tarihi geçti ama sözleşme hâlâ yürürlükte görünüyor.',
      });
    } else if (left <= END_WARNING_DAYS) {
      alerts.push({
        kind: 'ending',
        tone: 'warning',
        date: contract.endDate,
        message: contract.autoRenewal
          ? `${left} gün sonra otomatik olarak yenilenecek.`
          : `${left} gün sonra sona eriyor.`,
      });
    }
  }
  const notice = noticeDeadline(contract);
  if (live && notice) {
    const left = days(today, notice);
    if (left >= 0 && left <= NOTICE_WARNING_DAYS) {
      alerts.push({
        kind: 'notice',
        tone: left <= 7 ? 'danger' : 'warning',
        date: notice,
        message: `Fesih veya yeniden görüşme için son bildirim ${left} gün içinde.`,
      });
    }
  }
  const overdue = overduePayments(contract, today);
  if (overdue.length > 0) {
    alerts.push({
      kind: 'overdue-payment',
      tone: 'danger',
      date: overdue[0]?.dueDate ?? today,
      message: `${overdue.length} ödemenin vadesi geçti.`,
    });
  }
  return alerts;
}

export interface PaymentSummary {
  value: number | null;
  planned: number;
  invoiced: number;
  paid: number;
  /** Contract value not yet paid (`null` without a value). */
  remaining: number | null;
  /** Value not yet covered by the payment plan. */
  unplanned: number | null;
}

/** Money on a contract by stage; cancelled instalments are ignored. */
export function paymentSummary(
  contract: Pick<Contract, 'totalValue' | 'payments'>,
): PaymentSummary {
  const sum = (status: string) =>
    contract.payments.filter((p) => p.status === status).reduce((t, p) => t + p.amount, 0);
  const planned = sum('planned');
  const invoiced = sum('invoiced');
  const paid = sum('paid');
  const value = contract.totalValue;
  return {
    value,
    planned,
    invoiced,
    paid,
    remaining: value === null ? null : value - paid,
    unplanned: value === null ? null : value - planned - invoiced - paid,
  };
}

/** Amounts per currency (contracts are never converted). */
export function totalsByCurrency<T extends { currency: string }>(
  rows: readonly T[],
  amount: (row: T) => number | null,
): { currency: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const value = amount(row);
    if (value !== null) totals.set(row.currency, (totals.get(row.currency) ?? 0) + value);
  }
  return [...totals].map(([currency, total]) => ({ currency, amount: total }));
}

export interface ContractEvent {
  date: IsoDate;
  kind: 'end' | 'notice' | 'payment';
  contract: Contract;
  label: string;
  /** For payments: the instalment. */
  payment?: ContractPayment;
}

/**
 * Upcoming dates across contracts within `horizonDays`: ends, notice deadlines and open
 * instalments (overdue ones included, they are the most urgent). Earliest first.
 */
export function upcomingEvents(
  contracts: readonly Contract[],
  today: IsoDate,
  horizonDays: number,
): ContractEvent[] {
  const within = (date: IsoDate) => days(today, date) <= horizonDays;
  const events: ContractEvent[] = [];
  for (const contract of contracts) {
    if (contract.status !== 'active') continue;
    if (contract.endDate && contract.endDate >= today && within(contract.endDate)) {
      events.push({
        date: contract.endDate,
        kind: 'end',
        contract,
        label: contract.autoRenewal ? 'Otomatik yenileme' : 'Sözleşme bitişi',
      });
    }
    const notice = noticeDeadline(contract);
    if (notice && notice >= today && within(notice)) {
      events.push({ date: notice, kind: 'notice', contract, label: 'Son bildirim tarihi' });
    }
    for (const payment of contract.payments) {
      if (isOpenPayment(payment) && within(payment.dueDate)) {
        events.push({
          date: payment.dueDate,
          kind: 'payment',
          contract,
          payment,
          label: payment.dueDate < today ? 'Gecikmiş ödeme' : 'Ödeme vadesi',
        });
      }
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}
