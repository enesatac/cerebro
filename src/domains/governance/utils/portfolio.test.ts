import { describe, expect, it } from 'vitest';
import { seedTables } from '@/services/mock/database';
import type { PortfolioSnapshot } from './portfolio';
import {
  buildApplicationHealthReport,
  buildAttentionItems,
  buildPortfolioOverview,
} from './portfolio';
import { projects } from '@/services/mock/data/projects';
import { APP, ESC, PRJ, RISK } from '@/services/mock/data/ids';

const now = new Date('2026-09-26T12:00:00Z');
const snapshot = (): PortfolioSnapshot => structuredClone(seedTables);

describe('buildAttentionItems', () => {
  const items = buildAttentionItems(snapshot(), now);
  const ofKind = (kind: string) => items.filter((item) => item.kind === kind);

  it('flags live applications without a technical owner', () => {
    expect(ofKind('missing-technical-owner').map((i) => i.subject.id)).toEqual([
      APP.legacyBookingConsole,
    ]);
  });

  it('flags applications running on retired technology, naming it', () => {
    const [item] = ofKind('retired-technology');
    expect(item?.subject.id).toBe(APP.legacyBookingConsole);
    expect(item?.reason).toContain('AngularJS');
  });

  it('includes only high and critical active risks', () => {
    const risks = ofKind('critical-risk');
    expect(risks.every((i) => i.severity === 'high' || i.severity === 'critical')).toBe(true);
    // Mitigated single-acquirer risk is high but not active.
    expect(risks.map((i) => i.subject.id)).not.toContain(RISK.paySingleAcquirer);
  });

  it('includes every active escalation and no closed ones', () => {
    const ids = ofKind('active-escalation').map((i) => i.subject.id);
    expect(ids).toContain(ESC.fopsRosterSync);
    expect(ids).not.toContain(ESC.paySettlementMismatch);
  });

  it('flags overdue milestones of open projects only', () => {
    const milestones = ofKind('overdue-milestone');
    const vendorReady = projects.find((p) => p.id === PRJ.digitalOnboarding)?.milestones[1];
    expect(milestones.map((i) => i.id)).toContain(`milestone-${vendorReady?.id}`);
    expect(milestones.some((i) => i.subject.id === PRJ.workforceMfa)).toBe(false);
  });

  it('orders by severity, most severe first', () => {
    const ranks = items.map((i) => ['low', 'medium', 'high', 'critical'].indexOf(i.severity));
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
  });

  it('ignores retired applications', () => {
    const data = snapshot();
    const legacy = data.applications.find((a) => a.id === APP.legacyBookingConsole);
    if (!legacy) throw new Error('seed changed');
    legacy.lifecycle = 'retired';
    // Ids are unique per table only: compare application subjects with application ids.
    const ids = buildAttentionItems(data, now)
      .filter((i) => i.subject.kind === 'application')
      .map((i) => i.subject.id);
    expect(ids).not.toContain(APP.legacyBookingConsole);
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
  const row = (id: number) => rows.find((r) => r.id === id);

  it('reports missing required information by label', () => {
    expect(row(APP.legacyBookingConsole)?.missingRequired).toEqual(['Teknik sahip']);
  });

  it('lists deprecated and retired technologies once each', () => {
    const outdated = row(APP.legacyBookingConsole)?.outdatedTechnologies.map((t) => t.name);
    expect(outdated).toEqual(['AngularJS', 'Apache Struts 1']);
    expect(row(APP.financePlatform)?.outdatedTechnologies.map((t) => t.status)).toEqual([
      'deprecated',
      'deprecated',
    ]);
  });

  it('counts active risks and escalations per application', () => {
    expect(row(APP.paymentGateway)?.activeRiskCount).toBe(2);
    expect(row(APP.flightOperationsPortal)?.activeEscalationCount).toBe(1);
  });
});
