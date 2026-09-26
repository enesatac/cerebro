import { APPLICATION_LIFECYCLES, type Application } from '@/domains/applications/types';
import { evaluateApplicationCompleteness } from '@/domains/applications/utils/applicationCompleteness';
import type { BusinessUnit } from '@/domains/business-units/types';
import type { Escalation } from '@/domains/escalations/types';
import { isActiveEscalation } from '@/domains/escalations/utils/escalationPresentation';
import type { Person } from '@/domains/people/types';
import type { Project } from '@/domains/projects/types';
import type { Risk } from '@/domains/risks/types';
import { isActiveRisk } from '@/domains/risks/utils/riskPresentation';
import { CRITICALITIES, type Criticality, type EntityRef } from '@/domains/shared/types';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import type { Technology } from '@/domains/technologies/types';
import { isoDateInDays, toIsoDate } from '@/lib/dates';
import type {
  ApplicationHealthRow,
  AttentionItem,
  PortfolioOverview,
  RecentlyUpdatedEntry,
  UpcomingMilestone,
} from '../types';
import { getReviewState } from './staleness';

/** The tables portfolio-level rules read. A backend would run the same rules server-side. */
export interface PortfolioSnapshot {
  applications: readonly Application[];
  projects: readonly Project[];
  risks: readonly Risk[];
  escalations: readonly Escalation[];
  technologies: readonly Technology[];
  people: readonly Person[];
  businessUnits: readonly BusinessUnit[];
}

export const RECENTLY_UPDATED_LIMIT = 8;
export const UPCOMING_MILESTONE_DAYS = 60;

const rank = (severity: Criticality) => CRITICALITIES.indexOf(severity);
const isOpenProject = (project: Project) =>
  project.status !== 'completed' && project.status !== 'cancelled';
const isLiveApplication = (application: Application) => application.lifecycle !== 'retired';

function nameIndex(snapshot: PortfolioSnapshot) {
  const names = new Map<string, string>();
  for (const row of snapshot.applications) names.set(row.id, row.name);
  for (const row of snapshot.projects) names.set(row.id, row.name);
  const people = new Map(snapshot.people.map((person) => [person.id, person.fullName]));
  const describe = (applicationIds: string[], projectIds: string[]) =>
    [...applicationIds, ...projectIds].map((id) => names.get(id) ?? id).join(', ');
  const person = (id: string | null): EntityRef | null => {
    const name = id ? people.get(id) : undefined;
    return id && name ? { id, name } : null;
  };
  return { describe, person };
}

/** Severity first, then oldest date first (undated last). */
function compareAttention(a: AttentionItem, b: AttentionItem): number {
  return (
    rank(b.severity) - rank(a.severity) ||
    (a.date ?? '￿').localeCompare(b.date ?? '￿') ||
    a.subject.name.localeCompare(b.subject.name)
  );
}

/**
 * Attention rules. Each rule is deliberately narrow so the list stays actionable:
 * - live application without a technical owner (high if the app is high/critical)
 * - live application overdue for review (medium for critical apps, otherwise low)
 * - live application still running on a retired technology (high)
 * - active risk of high or critical severity
 * - active escalation (any severity)
 * - open project with a missed or overdue milestone (high for high/critical priority)
 * - open project in critical health (high)
 */
export function buildAttentionItems(snapshot: PortfolioSnapshot, now: Date): AttentionItem[] {
  const { describe } = nameIndex(snapshot);
  const today = toIsoDate(now);
  const technologies = new Map(snapshot.technologies.map((tech) => [tech.id, tech]));
  const items: AttentionItem[] = [];

  for (const app of snapshot.applications.filter(isLiveApplication)) {
    const subject = { kind: 'application' as const, id: app.id, name: app.name };
    const important = app.criticality === 'high' || app.criticality === 'critical';

    if (findPrimaryRoleHolder(app.roles, 'technical-owner') === null) {
      items.push({
        id: `owner-${app.id}`,
        kind: 'missing-technical-owner',
        severity: important ? 'high' : 'medium',
        subject,
        reason: 'Teknik sahip atanmamış',
        date: null,
      });
    }

    const review = getReviewState(app.audit, now);
    if (review.kind !== 'current') {
      items.push({
        id: `review-${app.id}`,
        kind: 'review-overdue',
        severity: app.criticality === 'critical' ? 'medium' : 'low',
        subject,
        reason:
          review.kind === 'never-reviewed'
            ? 'Bilgiler hiç gözden geçirilmemiş'
            : `Son gözden geçirme ${review.daysSinceReview} gün önce`,
        date: app.audit.lastReviewedAt,
      });
    }

    const retired = app.technologies
      .map((usage) => technologies.get(usage.technologyId))
      .filter((tech): tech is Technology => tech?.status === 'retired');
    if (retired.length > 0) {
      items.push({
        id: `retired-tech-${app.id}`,
        kind: 'retired-technology',
        severity: 'high',
        subject,
        reason: `Emekli teknoloji kullanıyor: ${[...new Set(retired.map((t) => t.name))].join(', ')}`,
        date: null,
      });
    }
  }

  for (const risk of snapshot.risks) {
    if (!isActiveRisk(risk.status) || rank(risk.severity) < rank('high')) continue;
    items.push({
      id: `risk-${risk.id}`,
      kind: 'critical-risk',
      severity: risk.severity,
      subject: { kind: 'risk', id: risk.id, name: risk.title },
      reason: `Etkilenen: ${describe(risk.relatedApplicationIds, risk.relatedProjectIds)}`,
      date: risk.dueDate,
    });
  }

  for (const escalation of snapshot.escalations) {
    if (!isActiveEscalation(escalation.status)) continue;
    items.push({
      id: `escalation-${escalation.id}`,
      kind: 'active-escalation',
      severity: escalation.severity,
      subject: { kind: 'escalation', id: escalation.id, name: escalation.title },
      reason: `Etkilenen: ${describe(escalation.relatedApplicationIds, escalation.relatedProjectIds)}`,
      date: escalation.targetResolutionDate,
    });
  }

  for (const project of snapshot.projects.filter(isOpenProject)) {
    const subject = { kind: 'project' as const, id: project.id, name: project.name };
    for (const milestone of project.milestones) {
      const overdue =
        milestone.status === 'missed' ||
        (milestone.status !== 'completed' && milestone.dueDate < today);
      if (!overdue) continue;
      items.push({
        id: `milestone-${milestone.id}`,
        kind: 'overdue-milestone',
        severity:
          project.priority === 'critical' || project.priority === 'high' ? 'high' : 'medium',
        subject,
        reason: `“${milestone.title}” kilometre taşı gecikmiş`,
        date: milestone.dueDate,
      });
    }
    if (project.health === 'critical') {
      items.push({
        id: `health-${project.id}`,
        kind: 'project-health',
        severity: 'high',
        subject,
        reason: 'Proje sağlığı kritik',
        date: null,
      });
    }
  }

  return items.sort(compareAttention);
}

function buildRecentlyUpdated(snapshot: PortfolioSnapshot): RecentlyUpdatedEntry[] {
  const { person } = nameIndex(snapshot);
  const entries: RecentlyUpdatedEntry[] = [
    ...snapshot.applications.map((row) => ({ kind: 'application' as const, row })),
    ...snapshot.projects.map((row) => ({ kind: 'project' as const, row })),
  ].map(({ kind, row }) => ({
    kind,
    id: row.id,
    name: row.name,
    code: row.code,
    updatedAt: row.audit.updatedAt,
    updatedBy: person(row.audit.updatedBy),
  }));
  return entries
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENTLY_UPDATED_LIMIT);
}

function buildUpcomingMilestones(snapshot: PortfolioSnapshot, now: Date): UpcomingMilestone[] {
  const today = toIsoDate(now);
  const horizon = isoDateInDays(UPCOMING_MILESTONE_DAYS, now);
  return snapshot.projects
    .filter(isOpenProject)
    .flatMap((project) =>
      project.milestones
        .filter((m) => m.status !== 'completed' && m.dueDate >= today && m.dueDate <= horizon)
        .map((m) => ({
          projectId: project.id,
          projectName: project.name,
          milestoneId: m.id,
          title: m.title,
          dueDate: m.dueDate,
          status: m.status,
        })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function buildPortfolioOverview(snapshot: PortfolioSnapshot, now: Date): PortfolioOverview {
  const live = snapshot.applications.filter(isLiveApplication);
  const activeRisks = snapshot.risks.filter((risk) => isActiveRisk(risk.status));
  const activeEscalations = snapshot.escalations.filter((e) => isActiveEscalation(e.status));

  return {
    applications: {
      total: snapshot.applications.length,
      active: snapshot.applications.filter((app) => app.lifecycle === 'active').length,
      critical: live.filter((app) => app.criticality === 'critical').length,
      withoutTechnicalOwner: live.filter(
        (app) => findPrimaryRoleHolder(app.roles, 'technical-owner') === null,
      ).length,
      reviewOverdue: live.filter((app) => getReviewState(app.audit, now).kind !== 'current').length,
    },
    projects: {
      total: snapshot.projects.length,
      inProgress: snapshot.projects.filter((p) => p.status === 'in-progress').length,
      atRiskOrCritical: snapshot.projects.filter(
        (p) => isOpenProject(p) && (p.health === 'at-risk' || p.health === 'critical'),
      ).length,
    },
    risks: {
      active: activeRisks.length,
      activeCritical: activeRisks.filter((risk) => risk.severity === 'critical').length,
    },
    escalations: {
      active: activeEscalations.length,
      activeCritical: activeEscalations.filter((e) => e.severity === 'critical').length,
    },
    lifecycleDistribution: APPLICATION_LIFECYCLES.map((lifecycle) => ({
      lifecycle,
      count: snapshot.applications.filter((app) => app.lifecycle === lifecycle).length,
    })),
    attention: buildAttentionItems(snapshot, now),
    recentlyUpdated: buildRecentlyUpdated(snapshot),
    upcomingMilestones: buildUpcomingMilestones(snapshot, now),
  };
}

export function buildApplicationHealthReport(
  snapshot: PortfolioSnapshot,
  now: Date,
): ApplicationHealthRow[] {
  const { person } = nameIndex(snapshot);
  const technologies = new Map(snapshot.technologies.map((tech) => [tech.id, tech]));
  const businessUnits = new Map(snapshot.businessUnits.map((unit) => [unit.id, unit.name]));
  const activeRisks = snapshot.risks.filter((risk) => isActiveRisk(risk.status));
  const activeEscalations = snapshot.escalations.filter((e) => isActiveEscalation(e.status));

  return snapshot.applications.map((app) => {
    const completeness = evaluateApplicationCompleteness(app);
    const outdated = new Map<string, ApplicationHealthRow['outdatedTechnologies'][number]>();
    for (const usage of app.technologies) {
      const tech = technologies.get(usage.technologyId);
      if (tech && (tech.status === 'deprecated' || tech.status === 'retired')) {
        outdated.set(tech.id, { id: tech.id, name: tech.name, status: tech.status });
      }
    }
    const buName = app.businessUnitId ? businessUnits.get(app.businessUnitId) : undefined;
    return {
      id: app.id,
      name: app.name,
      code: app.code,
      lifecycle: app.lifecycle,
      criticality: app.criticality,
      businessUnit: app.businessUnitId && buName ? { id: app.businessUnitId, name: buName } : null,
      technicalOwner: person(findPrimaryRoleHolder(app.roles, 'technical-owner')),
      completenessScore: completeness.score,
      missingRequired: completeness.missing
        .filter((rule) => rule.importance === 'required')
        .map((rule) => rule.label),
      missingRecommended: completeness.missing
        .filter((rule) => rule.importance === 'recommended')
        .map((rule) => rule.label),
      reviewState: getReviewState(app.audit, now),
      outdatedTechnologies: [...outdated.values()],
      activeRiskCount: activeRisks.filter((r) => r.relatedApplicationIds.includes(app.id)).length,
      activeEscalationCount: activeEscalations.filter((e) =>
        e.relatedApplicationIds.includes(app.id),
      ).length,
    };
  });
}
