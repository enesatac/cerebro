import { paths } from '@/app/router/paths';
import { BarList } from '@/components/data-display/BarList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatTile } from '@/components/data-display/StatTile';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { LIFECYCLE_PRESENTATION } from '@/domains/applications/utils/applicationPresentation';
import { MILESTONE_STATUS_PRESENTATION } from '@/domains/projects/utils/projectPresentation';
import { formatDate, formatRelative } from '@/lib/dates';
import { pluralize } from '@/lib/format';
import { usePortfolioOverview } from '../api/queries';
import { AttentionTable } from '../components/AttentionTable';
import type { PortfolioOverview } from '../types';
import { UPCOMING_MILESTONE_DAYS } from '../utils/portfolio';

function KeyFigures({ overview }: { overview: PortfolioOverview }) {
  const { applications, projects, risks, escalations } = overview;
  return (
    <section aria-label="Portfolio overview" className="c-stat-grid">
      <StatTile
        label="Applications"
        value={applications.total}
        detail={`${applications.active} active`}
        to={paths.applications.list()}
      />
      <StatTile
        label="Critical applications"
        value={applications.critical}
        detail="business-critical, not retired"
        to={`${paths.applications.list()}?criticality=critical`}
      />
      <StatTile
        label="Projects in progress"
        value={projects.inProgress}
        detail={`${projects.atRiskOrCritical} at risk or critical`}
        to={`${paths.projects.list()}?status=in-progress`}
      />
      <StatTile
        label="Active risks"
        value={risks.active}
        detail={`${risks.activeCritical} critical`}
        tone={risks.activeCritical > 0 ? 'warning' : 'default'}
        to={paths.risks('risks')}
      />
      <StatTile
        label="Active escalations"
        value={escalations.active}
        detail={`${escalations.activeCritical} critical`}
        tone={escalations.activeCritical > 0 ? 'warning' : 'default'}
        to={paths.risks('escalations')}
      />
      <StatTile
        label="Data gaps"
        value={applications.withoutTechnicalOwner + applications.reviewOverdue}
        detail={`${applications.withoutTechnicalOwner} without owner · ${applications.reviewOverdue} review overdue`}
        tone={applications.withoutTechnicalOwner > 0 ? 'warning' : 'default'}
        to={paths.reports()}
      />
    </section>
  );
}

function RecentlyUpdated({ overview }: { overview: PortfolioOverview }) {
  const now = new Date();
  return (
    <SectionCard title="Recently updated">
      {overview.recentlyUpdated.length === 0 ? (
        <EmptyState compact title="No recent changes" />
      ) : (
        <ul className="c-rule-list">
          {overview.recentlyUpdated.map((entry) => (
            <li
              key={`${entry.kind}-${entry.id}`}
              className="c-rule-list__item c-rule-list__item--row"
            >
              <span className="c-cell-stack">
                <EntityLink
                  to={
                    entry.kind === 'application'
                      ? paths.applications.detail(entry.id)
                      : paths.projects.detail(entry.id)
                  }
                >
                  {entry.name}
                </EntityLink>
                <span className="c-muted c-cell-stack__secondary">
                  {entry.kind === 'application' ? 'Application' : 'Project'} · {entry.code}
                  {entry.updatedBy && ` · by ${entry.updatedBy.name}`}
                </span>
              </span>
              <span className="c-muted">{formatRelative(entry.updatedAt, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function LifecycleDistribution({ overview }: { overview: PortfolioOverview }) {
  return (
    <SectionCard
      title="Applications by lifecycle"
      description="Select a stage to see its applications."
    >
      <BarList
        label="Applications by lifecycle"
        items={overview.lifecycleDistribution.map(({ lifecycle, count }) => ({
          id: lifecycle,
          label: LIFECYCLE_PRESENTATION[lifecycle].label,
          value: count,
          to: `${paths.applications.list()}?lifecycle=${lifecycle}`,
        }))}
      />
    </SectionCard>
  );
}

function UpcomingMilestones({ overview }: { overview: PortfolioOverview }) {
  return (
    <SectionCard
      title="Upcoming milestones"
      description={`Due in the next ${UPCOMING_MILESTONE_DAYS} days.`}
    >
      {overview.upcomingMilestones.length === 0 ? (
        <EmptyState
          compact
          title={`No milestones are due in the next ${UPCOMING_MILESTONE_DAYS} days`}
        />
      ) : (
        <ul className="c-rule-list">
          {overview.upcomingMilestones.map((milestone) => (
            <li key={milestone.milestoneId} className="c-rule-list__item c-rule-list__item--row">
              <span className="c-cell-stack">
                <span>{milestone.title}</span>
                <EntityLink to={paths.projects.detail(milestone.projectId)}>
                  {milestone.projectName}
                </EntityLink>
              </span>
              <span className="c-cell-stack c-align-end">
                <span>{formatDate(milestone.dueDate)}</span>
                <StatusBadge {...MILESTONE_STATUS_PRESENTATION[milestone.status]} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export default function DashboardPage() {
  const query = usePortfolioOverview();
  return (
    <div className="c-stack">
      <PageHeader
        title="Dashboard"
        subtitle="What the portfolio contains, what needs attention and what changed."
      />
      <QueryView
        query={query}
        loadingLabel="Loading dashboard"
        errorTitle="The dashboard could not be loaded"
      >
        {(overview) => (
          <>
            <KeyFigures overview={overview} />
            <SectionCard
              title={`Needs attention (${overview.attention.length})`}
              description={`Most severe first · ${pluralize(overview.attention.filter((i) => i.severity === 'critical').length, 'critical item')}`}
            >
              <AttentionTable items={overview.attention} />
            </SectionCard>
            <div className="c-two-column">
              <RecentlyUpdated overview={overview} />
              <div className="c-stack">
                <LifecycleDistribution overview={overview} />
                <UpcomingMilestones overview={overview} />
              </div>
            </div>
          </>
        )}
      </QueryView>
    </div>
  );
}
