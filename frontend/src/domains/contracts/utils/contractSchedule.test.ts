import { describe, expect, it } from 'vitest';
import { contracts } from '@/services/mock/data/contracts';
import { CON } from '@/services/mock/data/ids';
import type { Contract } from '../types';
import {
  contractAlerts,
  noticeDeadline,
  paymentSummary,
  totalsByCurrency,
  upcomingEvents,
} from './contractSchedule';

const TODAY = '2026-10-03';
const seed = (id: number) => contracts.find((c) => c.id === id) as Contract;
const kinds = (id: number) => contractAlerts(seed(id), TODAY).map((a) => a.kind);

describe('contract schedule', () => {
  it('computes the last notice date from the end date and notice period', () => {
    expect(noticeDeadline(seed(CON.identityVerification))).toBe('2026-11-02');
    expect(noticeDeadline({ endDate: null, noticePeriodDays: 30 })).toBeNull();
    expect(noticeDeadline({ endDate: '2027-01-01', noticePeriodDays: null })).toBeNull();
  });

  it('flags what needs attention on active contracts', () => {
    expect(kinds(CON.smsGateway)).toEqual(['expired-active']);
    expect(kinds(CON.identityVerification)).toEqual(['notice', 'overdue-payment']);
    expect(kinds(CON.mfaTokens)).toEqual(['ending', 'overdue-payment']);
    expect(kinds(CON.paymentHsm)).toEqual([]);
    // Drafts and expired contracts raise nothing.
    expect(kinds(CON.biPlatform)).toEqual([]);
    expect(kinds(CON.uxResearch)).toEqual([]);
  });

  it('sums money by stage and ignores cancelled instalments', () => {
    const contract = {
      totalValue: 1000,
      payments: [
        {
          id: 1,
          dueDate: '2026-01-01',
          amount: 300,
          status: 'paid',
          description: '',
          invoiceNumber: '',
          paidDate: '2026-01-05',
        },
        {
          id: 2,
          dueDate: '2026-02-01',
          amount: 200,
          status: 'invoiced',
          description: '',
          invoiceNumber: '',
          paidDate: null,
        },
        {
          id: 3,
          dueDate: '2026-03-01',
          amount: 100,
          status: 'planned',
          description: '',
          invoiceNumber: '',
          paidDate: null,
        },
        {
          id: 4,
          dueDate: '2026-04-01',
          amount: 999,
          status: 'cancelled',
          description: '',
          invoiceNumber: '',
          paidDate: null,
        },
      ],
    };
    expect(paymentSummary(contract)).toEqual({
      value: 1000,
      planned: 100,
      invoiced: 200,
      paid: 300,
      remaining: 700,
      unplanned: 400,
    });
  });

  it('keeps currencies apart', () => {
    expect(
      totalsByCurrency(
        [
          { currency: 'TRY', v: 10 },
          { currency: 'EUR', v: 5 },
          { currency: 'TRY', v: 2 },
          { currency: 'USD', v: null },
        ],
        (r) => r.v,
      ),
    ).toEqual([
      { currency: 'TRY', amount: 12 },
      { currency: 'EUR', amount: 5 },
    ]);
  });

  it('lists upcoming dates earliest first, overdue payments included', () => {
    const events = upcomingEvents(contracts, TODAY, 60);
    expect(events.map((e) => e.date)).toEqual([...events.map((e) => e.date)].sort());
    expect(events[0]).toMatchObject({ kind: 'payment', label: 'Gecikmiş ödeme' });
    expect(events.some((e) => e.kind === 'notice' && e.contract.id === CON.observability)).toBe(
      true,
    );
    expect(events.some((e) => e.date > '2026-12-02')).toBe(false);
  });
});
