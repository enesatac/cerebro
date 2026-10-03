import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { AttentionNotices } from '@/domains/governance/components/AttentionNotices';
import { useTabParam } from '@/hooks/useTabParam';
import { isNotFoundError } from '@/lib/errors';
import { useApplication } from '../api/queries';
import { ApplicationKeyFacts } from '../components/detail/ApplicationKeyFacts';
import { DependenciesTab } from '../components/detail/DependenciesTab';
import { DocumentationTab } from '../components/detail/DocumentationTab';
import { EnvironmentsTab } from '../components/detail/EnvironmentsTab';
import { HistoryTab } from '../components/detail/HistoryTab';
import { IntegrationsTab } from '../components/detail/IntegrationsTab';
import { OverviewTab } from '../components/detail/OverviewTab';
import { ProjectsTab } from '../components/detail/ProjectsTab';
import { RepositoriesTab } from '../components/detail/RepositoriesTab';
import { RisksEscalationsTab } from '../components/detail/RisksEscalationsTab';
import { TechnicalTab } from '../components/detail/TechnicalTab';
import { RunbookTab } from '@/domains/runbooks/components/RunbookTab';
import type { Application } from '../types';
import {
  APPLICATION_DETAIL_TAB_IDS,
  APPLICATION_DETAIL_TABS,
  type ApplicationDetailTab,
} from '../utils/applicationTabs';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { GuardedActionMenu } from '@/domains/auth/components/GuardedActionMenu';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { ApplicationDeleteAction } from '../components/ApplicationDeleteAction';
import { parseId } from '@/lib/urlParams';

const TAB_CONTENT: Record<ApplicationDetailTab, (application: Application) => ReactNode> = {
  overview: (a) => <OverviewTab application={a} />,
  runbook: (a) => <RunbookTab application={a} />,
  technical: (a) => <TechnicalTab application={a} />,
  dependencies: (a) => <DependenciesTab application={a} />,
  integrations: (a) => <IntegrationsTab application={a} />,
  environments: (a) => <EnvironmentsTab application={a} />,
  repositories: (a) => <RepositoriesTab application={a} />,
  documentation: (a) => <DocumentationTab application={a} />,
  projects: (a) => <ProjectsTab application={a} />,
  risks: (a) => <RisksEscalationsTab application={a} />,
  history: (a) => <HistoryTab application={a} />,
};

/** Counts that are free to compute from the loaded record (others load lazily per tab). */
function tabCount(tab: ApplicationDetailTab, application: Application): number | null {
  switch (tab) {
    case 'environments':
      return application.environments.length;
    case 'repositories':
      return application.repositories.length;
    case 'documentation':
      return application.documentation.length;
    default:
      return null;
  }
}

export default function ApplicationDetailPage() {
  const navigate = useNavigate();
  const requestedId = useParams().applicationId ?? '';
  // Unknown or malformed ids resolve to 0, which no sequence ever produces → "not found".
  const applicationId = parseId(requestedId) ?? 0;
  const [activeTab, selectTab] = useTabParam(APPLICATION_DETAIL_TAB_IDS);
  const query = useApplication(applicationId);

  if (query.isPending) return <LoadingState label="Uygulama yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Uygulama bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir uygulama yok. Kaldırılmış ya da bağlantı hatalı olabilir.`}
        backTo={paths.applications.list()}
        backLabel="Uygulamalara dön"
      />
    ) : (
      <ErrorState title="Bu uygulama yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }

  const application = query.data;

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Uygulamalar', to: paths.applications.list() },
          { label: application.name },
        ]}
        title={application.name}
        subtitle={application.shortDescription}
        meta={
          <>
            <span className="c-code-chip">{application.code}</span>
            <span className="c-muted">
              <MasterLabel list="applicationTypes" code={application.type} />
            </span>
            <MasterBadge
              list="applicationLifecycles"
              code={application.lifecycle}
              context="Yaşam döngüsü:"
            />
            <MasterBadge
              list="criticalities"
              code={application.criticality}
              format={(label) => `Kritiklik: ${label}`}
            />
            <MasterBadge
              list="operationalStatuses"
              code={application.operationalStatus}
              context="Durum:"
            />
          </>
        }
        actions={
          <>
            <EditAction
              to={paths.applications.edit(application.id)}
              privilege="applications:edit"
            />
            <ApplicationDeleteAction
              record={application}
              onDeleted={() => void navigate(paths.applications.list())}
            />
            <GuardedActionMenu
              items={[
                {
                  label: 'Bağımlılık ekle',
                  to: paths.dependencies.create(application.id),
                  privilege: 'connections:edit',
                },
                {
                  label: 'Entegrasyon ekle',
                  to: paths.integrations.create(application.id),
                  privilege: 'connections:edit',
                },
                {
                  label: 'Risk kaydet',
                  to: paths.riskForms.create({ application: application.id }),
                  privilege: 'risks:edit',
                },
                {
                  label: 'Eskalasyon aç',
                  to: paths.escalationForms.create({ application: application.id }),
                  privilege: 'risks:edit',
                },
                {
                  label: 'Karar kaydet',
                  to: paths.decisionForms.create({ application: application.id }),
                  privilege: 'risks:edit',
                },
              ]}
            />
            <CopyLinkButton />
          </>
        }
      />
      <ApplicationKeyFacts application={application} />
      <AttentionNotices
        filter={{ applicationId: application.id }}
        audit={application.audit}
        entityLabel="uygulama"
        onOpenRisks={() => selectTab('risks')}
      />
      <DetailTabs
        label="Uygulama bölümleri"
        tabs={APPLICATION_DETAIL_TABS.map((tab) => ({
          ...tab,
          count: tabCount(tab.id, application),
        }))}
        active={activeTab}
        onSelect={selectTab}
        renderPanel={(tab) => TAB_CONTENT[tab](application)}
      />
    </div>
  );
}
