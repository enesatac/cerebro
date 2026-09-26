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
    <section aria-label="Portföy özeti" className="c-stat-grid">
      <StatTile
        label="Uygulamalar"
        value={applications.total}
        detail={`${applications.active} aktif`}
        to={paths.applications.list()}
      />
      <StatTile
        label="Kritik uygulamalar"
        value={applications.critical}
        detail="iş açısından kritik, emekli olmayan"
        to={`${paths.applications.list()}?criticality=critical`}
      />
      <StatTile
        label="Devam eden projeler"
        value={projects.inProgress}
        detail={`${projects.atRiskOrCritical} riskli veya kritik`}
        to={`${paths.projects.list()}?status=in-progress`}
      />
      <StatTile
        label="Aktif riskler"
        value={risks.active}
        detail={`${risks.activeCritical} kritik`}
        tone={risks.activeCritical > 0 ? 'warning' : 'default'}
        to={paths.risks('risks')}
      />
      <StatTile
        label="Aktif eskalasyonlar"
        value={escalations.active}
        detail={`${escalations.activeCritical} kritik`}
        tone={escalations.activeCritical > 0 ? 'warning' : 'default'}
        to={paths.risks('escalations')}
      />
      <StatTile
        label="Veri eksikleri"
        value={applications.withoutTechnicalOwner + applications.reviewOverdue}
        detail={`${applications.withoutTechnicalOwner} sahipsiz · ${applications.reviewOverdue} gözden geçirmesi gecikmiş`}
        tone={applications.withoutTechnicalOwner > 0 ? 'warning' : 'default'}
        to={paths.reports()}
      />
    </section>
  );
}

function RecentlyUpdated({ overview }: { overview: PortfolioOverview }) {
  const now = new Date();
  return (
    <SectionCard title="Son güncellenenler">
      {overview.recentlyUpdated.length === 0 ? (
        <EmptyState compact title="Son zamanlarda değişiklik yok" />
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
                  {entry.kind === 'application' ? 'Uygulama' : 'Proje'} · {entry.code}
                  {entry.updatedBy && ` · ${entry.updatedBy.name}`}
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
      title="Yaşam döngüsüne göre uygulamalar"
      description="Uygulamalarını görmek için bir aşama seçin."
    >
      <BarList
        label="Yaşam döngüsüne göre uygulamalar"
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
      title="Yaklaşan kilometre taşları"
      description={`Önümüzdeki ${UPCOMING_MILESTONE_DAYS} gün içinde.`}
    >
      {overview.upcomingMilestones.length === 0 ? (
        <EmptyState
          compact
          title={`Önümüzdeki ${UPCOMING_MILESTONE_DAYS} gün içinde kilometre taşı yok`}
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
        title="Gösterge paneli"
        subtitle="Portföyde neler var, neler ilgi bekliyor ve neler değişti."
      />
      <QueryView
        query={query}
        loadingLabel="Gösterge paneli yükleniyor"
        errorTitle="Gösterge paneli yüklenemedi"
      >
        {(overview) => (
          <>
            <KeyFigures overview={overview} />
            <SectionCard
              title={`İlgi bekleyenler (${overview.attention.length})`}
              description={`En ciddi olanlar önce · ${pluralize(overview.attention.filter((i) => i.severity === 'critical').length, 'kritik kayıt')}`}
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
