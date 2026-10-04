import { addDays, addMonths, differenceInCalendarDays, endOfMonth, parseISO } from 'date-fns';
import type { Application } from '@/domains/applications/types';
import type { BusinessUnit } from '@/domains/business-units/types';
import type { Decision } from '@/domains/decisions/types';
import type { Escalation } from '@/domains/escalations/types';
import { isActiveEscalation } from '@/domains/escalations/utils/escalationPresentation';
import type { LeaveRecord } from '@/domains/leaves/types';
import { workingDays } from '@/domains/leaves/utils/leaveCalendar';
import type { Project } from '@/domains/projects/types';
import type { Allocation } from '@/domains/resources/types';
import type { Risk } from '@/domains/risks/types';
import { isActiveRisk } from '@/domains/risks/utils/riskPresentation';
import type { IsoDate } from '@/domains/shared/types';
import type { Technology } from '@/domains/technologies/types';
import { toIsoDate } from '@/lib/dates';
import type { CategoryCount, PortfolioTrends, ReportPeriod, TrendSeries } from '../types';

export interface TrendSource {
  applications: readonly Application[];
  projects: readonly Project[];
  escalations: readonly Escalation[];
  risks: readonly Risk[];
  decisions: readonly Decision[];
  allocations: readonly Allocation[];
  leaves: readonly LeaveRecord[];
  technologies: readonly Technology[];
  businessUnits: readonly BusinessUnit[];
}

/** Statuses of projects that will not run, so they never count as active. */
const NOT_RUNNING = new Set(['cancelled', 'rejected']);
const TOP_TECHNOLOGIES = 10;

interface Month {
  from: IsoDate;
  to: IsoDate;
}

export function monthsOf(period: ReportPeriod): Month[] {
  const first = parseISO(period.from);
  return Array.from({ length: period.months }, (_, index) => {
    const start = addMonths(first, index);
    return { from: toIsoDate(start), to: toIsoDate(endOfMonth(start)) };
  });
}

const monthOf = (months: readonly Month[], date: IsoDate) =>
  months.findIndex((m) => m.from <= date && date <= m.to);

const overlapDays = (start: IsoDate, end: IsoDate, month: Month) => {
  const from = start > month.from ? start : month.from;
  const to = end < month.to ? end : month.to;
  return from <= to ? workingDays(from, to) : 0;
};

/** Counts per month, split by `keyOf`; keys keep first-seen order. */
function countByMonth<T>(
  rows: readonly T[],
  months: readonly Month[],
  dateOf: (row: T) => IsoDate | null,
  keyOf: (row: T) => string,
): TrendSeries[] {
  const series = new Map<string, number[]>();
  for (const row of rows) {
    const date = dateOf(row);
    const index = date ? monthOf(months, date) : -1;
    if (index === -1) continue;
    const key = keyOf(row);
    const values = series.get(key) ?? months.map(() => 0);
    values[index] = (values[index] ?? 0) + 1;
    series.set(key, values);
  }
  return [...series].map(([key, values]) => ({ key, values }));
}

function counts<T>(rows: readonly T[], keyOf: (row: T) => string): CategoryCount[] {
  const map = new Map<string, number>();
  for (const row of rows) map.set(keyOf(row), (map.get(keyOf(row)) ?? 0) + 1);
  return [...map].map(([key, value]) => ({ key, value }));
}

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

const projectSpan = (project: Project) => ({
  start: project.timeline.actualStartDate ?? project.timeline.plannedStartDate,
  end: project.timeline.actualEndDate ?? project.timeline.plannedEndDate,
});

/**
 * Monthly series and current distributions for the reports. Past months use what happened
 * (actual dates); months after today use plans, so the charts show history and outlook together.
 */
export function buildPortfolioTrends(
  source: TrendSource,
  period: ReportPeriod,
  today: IsoDate,
): PortfolioTrends {
  const months = monthsOf(period);
  const currentMonthIndex = monthOf(months, today);
  const afterToday = (index: number) => (months[index]?.from ?? '') > today;

  const activeProjects = months.map(
    (month) =>
      source.projects.filter((project) => {
        if (NOT_RUNNING.has(project.status)) return false;
        const { start, end } = projectSpan(project);
        return start !== null && start <= month.to && (end === null || end >= month.from);
      }).length,
  );

  const escalationsOpenAtMonthEnd = months.map((month, index) => {
    if (afterToday(index)) return null;
    const cutoff = month.to < today ? month.to : today;
    return source.escalations.filter((e) => {
      const raised = e.raisedAt.slice(0, 10);
      if (raised > cutoff) return false;
      if (e.resolvedOn) return e.resolvedOn > cutoff;
      return isActiveEscalation(e.status);
    }).length;
  });

  const escalationMedianDaysToResolve = months.map((month) =>
    median(
      source.escalations
        .filter((e) => e.resolvedOn && e.resolvedOn >= month.from && e.resolvedOn <= month.to)
        .map((e) =>
          differenceInCalendarDays(parseISO(e.resolvedOn ?? ''), parseISO(e.raisedAt.slice(0, 10))),
        ),
    ),
  );

  const projectIds = [...new Set(source.allocations.map((a) => a.projectId))].sort((a, b) => a - b);
  const capacityByProject: TrendSeries[] = projectIds.map((projectId) => ({
    key: String(projectId),
    values: months.map((month) => {
      const capacity = workingDays(month.from, month.to);
      const fte = source.allocations
        .filter((a) => a.projectId === projectId)
        .reduce(
          (sum, a) => sum + (overlapDays(a.startDate, a.endDate, month) * a.percent) / 100,
          0,
        );
      return capacity === 0 ? 0 : Math.round((fte / capacity) * 10) / 10;
    }),
  }));

  const people = [...new Set(source.allocations.map((a) => a.personId))];
  const overallocatedPeople = months.map(
    (month) =>
      people.filter((personId) => {
        const own = source.allocations.filter(
          (a) => a.personId === personId && a.startDate <= month.to && a.endDate >= month.from,
        );
        if (own.length < 2) return own.some((a) => a.percent > 100);
        for (let day = parseISO(month.from); toIsoDate(day) <= month.to; day = addDays(day, 1)) {
          const date = toIsoDate(day);
          const load = own.reduce(
            (sum, a) => (a.startDate <= date && date <= a.endDate ? sum + a.percent : sum),
            0,
          );
          if (load > 100) return true;
        }
        return false;
      }).length,
  );

  const leaveTypes = [...new Set(source.leaves.map((l) => l.type))];
  const leaveDaysByType: TrendSeries[] = leaveTypes.map((type) => ({
    key: type,
    values: months.map((month) =>
      source.leaves
        .filter((l) => l.type === type)
        .reduce((sum, l) => sum + overlapDays(l.startDate, l.endDate, month), 0),
    ),
  }));

  const technologyNames = new Map(source.technologies.map((t) => [t.id, t.name]));
  const liveApplications = source.applications.filter((a) => a.lifecycle !== 'retired');
  const unitNames = new Map(source.businessUnits.map((b) => [b.id, b.name]));

  return {
    months: months.map((m) => m.from),
    currentMonthIndex,
    activeProjects,
    milestonesByStatus: countByMonth(
      source.projects.flatMap((p) => p.milestones),
      months,
      (m) => m.dueDate,
      (m) => m.status,
    ),
    escalationsRaised: countByMonth(
      source.escalations,
      months,
      (e) => e.raisedAt.slice(0, 10),
      (e) => e.severity,
    ),
    escalationsOpenAtMonthEnd,
    escalationMedianDaysToResolve,
    risksRegistered: countByMonth(
      source.risks,
      months,
      (r) => r.audit.createdAt.slice(0, 10),
      (r) => r.severity,
    ),
    decisionsByStatus: countByMonth(
      source.decisions,
      months,
      (d) => d.decisionDate,
      (d) => d.status,
    ),
    capacityByProject,
    overallocatedPeople,
    leaveDaysByType,
    applicationsByLifecycle: counts(source.applications, (a) => a.lifecycle),
    applicationsByCriticality: counts(liveApplications, (a) => a.criticality),
    applicationsByBusinessUnit: counts(liveApplications, (a) => String(a.businessUnitId ?? 0))
      .map((c) => ({ ...c, label: unitNames.get(Number(c.key)) ?? 'İş birimi yok' }))
      .sort((a, b) => b.value - a.value),
    projectsByStatus: counts(source.projects, (p) => p.status),
    projectsByHealth: counts(
      source.projects.filter((p) => !NOT_RUNNING.has(p.status)),
      (p) => p.health,
    ),
    topTechnologies: counts(
      liveApplications.flatMap((a) => [...new Set(a.technologies.map((t) => t.technologyId))]),
      (id) => String(id),
    )
      .map((c) => ({ ...c, label: technologyNames.get(Number(c.key)) ?? `#${c.key}` }))
      .sort((a, b) => b.value - a.value || (a.label ?? '').localeCompare(b.label ?? '', 'tr'))
      .slice(0, TOP_TECHNOLOGIES),
    activeRiskMatrix: counts(
      source.risks.filter((r) => isActiveRisk(r.status)),
      (r) => `${r.probability}|${r.impact}`,
    ).map(({ key, value }) => {
      const [probability = '', impact = ''] = key.split('|');
      return { probability, impact, count: value };
    }),
  };
}
