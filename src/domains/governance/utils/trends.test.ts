import { describe, expect, it } from 'vitest';
import { createMockDatabase } from '@/services/mock/database';
import { buildPortfolioTrends, monthsOf } from './trends';

const db = createMockDatabase();
const trends = buildPortfolioTrends(db, { from: '2025-10-01', months: 18 }, '2026-10-02');
const sum = (values: readonly (number | null)[]) =>
  values.reduce<number>((a, v) => a + (v ?? 0), 0);

describe('portfolio trends', () => {
  it('builds whole months and finds the current one', () => {
    expect(monthsOf({ from: '2026-11-01', months: 3 })).toEqual([
      { from: '2026-11-01', to: '2026-11-30' },
      { from: '2026-12-01', to: '2026-12-31' },
      { from: '2027-01-01', to: '2027-01-31' },
    ]);
    expect(trends.months).toHaveLength(18);
    expect(trends.months[trends.currentMonthIndex]).toBe('2026-10-01');
  });

  it('counts running projects per month, using plans for the future', () => {
    // October 2026: all but the MFA rollout (completed in March) and management reporting
    // (starts in November).
    expect(trends.activeProjects[trends.currentMonthIndex]).toBe(6);
    expect(trends.activeProjects[trends.currentMonthIndex + 1]).toBe(7);
    // October 2025: only the MFA rollout had started.
    expect(trends.activeProjects[0]).toBe(1);
  });

  it('counts raised escalations by severity and the open backlog at month end', () => {
    const raised = trends.escalationsRaised.flatMap((s) => s.values);
    expect(sum(raised)).toBe(db.escalations.length);
    // Today three escalations are open; months after today have no backlog yet.
    expect(trends.escalationsOpenAtMonthEnd[trends.currentMonthIndex]).toBe(3);
    expect(trends.escalationsOpenAtMonthEnd[trends.currentMonthIndex + 1]).toBeNull();
    // December 2025: resolved in 0 days (3D Secure outage) and 7 days (order statuses).
    expect(trends.escalationMedianDaysToResolve[2]).toBe(3.5);
  });

  it('expresses planned capacity in full-time equivalents per project', () => {
    const october = trends.capacityByProject.map((s) => s.values[trends.currentMonthIndex] ?? 0);
    expect(sum(october)).toBeGreaterThan(5);
    expect(october.every((fte) => fte >= 0 && fte <= 10)).toBe(true);
    expect(trends.overallocatedPeople[trends.currentMonthIndex]).toBeGreaterThan(0);
  });

  it('summarises today’s distributions', () => {
    expect(sum(trends.applicationsByLifecycle.map((c) => c.value))).toBe(db.applications.length);
    expect(trends.topTechnologies.length).toBeLessThanOrEqual(10);
    expect(trends.topTechnologies[0]?.label).toBeTruthy();
    const matrixTotal = sum(trends.activeRiskMatrix.map((c) => c.count));
    expect(matrixTotal).toBe(
      db.risks.filter((r) => r.status === 'open' || r.status === 'monitoring').length,
    );
  });
});
