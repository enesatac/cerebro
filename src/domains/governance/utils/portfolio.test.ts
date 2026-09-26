import { describe, expect, it } from 'vitest';
import { seedTables } from '@/services/mock/database';
import type { PortfolioSnapshot } from './portfolio';
import {
  buildApplicationHealthReport,
  buildAttentionItems,
  buildPortfolioOverview,
} from './portfolio';

const now = new Date('2026-09-26T12:00:00Z');
const snapshot = (): PortfolioSnapshot => structuredClone(seedTables);

describe('buildAttentionItems', () => {
  const items = buildAttentionItems(snapshot(), now);
  const ofKind = (kind: string) => items.filter((item) => item.kind === kind);

  it('flags live applications without a technical owner', () => {
    expect(ofKind('missing-technical-owner').map((i) => i.subject.id)).toEqual([
      'app-legacy-booking-console',
    ]);
  });

  it('flags applications running on retired technology, naming it', () => {
    const [item] = ofKind('retired-technology');
    expect(item?.subject.id).toBe('app-legacy-booking-console');
    expect(item?.reason).toContain('AngularJS');
  });

  it('includes only high and critical active risks', () => {
    const risks = ofKind('critical-risk');
    expect(risks.every((i) => i.severity === 'high' || i.severity === 'critical')).toBe(true);
    // Mitigated single-acquirer risk is high but not active.
    expect(risks.map((i) => i.subject.id)).not.toContain('risk-pay-single-acquirer');
  });

  it('includes every active escalation and no closed ones', () => {
    const ids = ofKind('active-escalation').map((i) => i.subject.id);
    expect(ids).toContain('esc-fops-roster-sync');
    expect(ids).not.toContain('esc-pay-settlement-mismatch');
  });

  it('flags overdue milestones of open projects only', () => {
    const milestones = ofKind('overdue-milestone');
    expect(milestones.map((i) => i.id)).toContain('milestone-dot-ms-2');
    expect(milestones.some((i) => i.subject.id === 'prj-workforce-mfa')).toBe(false);
  });

  it('orders by severity, most severe first', () => {
    const ranks = items.map((i) => ['low', 'medium', 'high', 'critical'].indexOf(i.severity));
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
  });

  it('ignores retired applications', () => {
    const data = snapshot();
    const legacy = data.applications.find((a) => a.id === 'app-legacy-booking-console');
    if (!legacy) throw new Error('seed changed');
    legacy.lifecycle = 'retired';
    const ids = buildAttentionItems(data, now).map((i) => i.subject.id);
    expect(ids).not.toContain('app-legacy-booking-console');
  });
});

describe('buildPortfolioOverview', () => {
  const overview = buildPortfolioOverview(snapshot(), now);

  it('counts applications per lifecycle stage, in lifecycle order, including empty stages', () => {
    expect(overview.lifecycleDistribution.map((d) => d.lifecycle)).toEqual([
      'planned',
      'development',
      'active',
      'maintenance',
      'deprecated',
      'retired',
    ]);
    expect(overview.lifecycleDistribution.reduce((sum, d) => sum + d.count, 0)).toBe(
      overview.applications.total,
    );
  });

  it('lists recently updated records newest first', () => {
    const dates = overview.recentlyUpdated.map((entry) => entry.updatedAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(overview.recentlyUpdated.length).toBeLessThanOrEqual(8);
  });

  it('lists only open milestones due within the horizon', () => {
    for (const milestone of overview.upcomingMilestones) {
      expect(milestone.dueDate >= '2026-09-26').toBe(true);
      expect(milestone.dueDate <= '2026-11-25').toBe(true);
      expect(milestone.status).not.toBe('completed');
    }
  });
});

describe('buildApplicationHealthReport', () => {
  const rows = buildApplicationHealthReport(snapshot(), now);
  const row = (id: string) => rows.find((r) => r.id === id);

  it('reports missing required information by label', () => {
    expect(row('app-legacy-booking-console')?.missingRequired).toEqual(['Teknik sahip']);
  });

  it('lists deprecated and retired technologies once each', () => {
    const outdated = row('app-legacy-booking-console')?.outdatedTechnologies.map((t) => t.name);
    expect(outdated).toEqual(['AngularJS', 'Apache Struts 1']);
    expect(row('app-finance-platform')?.outdatedTechnologies.map((t) => t.status)).toEqual([
      'deprecated',
      'deprecated',
    ]);
  });

  it('counts active risks and escalations per application', () => {
    expect(row('app-payment-gateway')?.activeRiskCount).toBe(1);
    expect(row('app-flight-operations-portal')?.activeEscalationCount).toBe(1);
  });
});
