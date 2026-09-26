import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
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
import type { Application } from '../types';
import {
  LIFECYCLE_PRESENTATION,
  OPERATIONAL_STATUS_PRESENTATION,
  APPLICATION_TYPE_LABELS,
} from '../utils/applicationPresentation';
import {
  APPLICATION_DETAIL_TAB_IDS,
  APPLICATION_DETAIL_TABS,
  type ApplicationDetailTab,
} from '../utils/applicationTabs';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { Can } from '@/domains/auth/components/Can';
import { ActionMenu } from '@/components/actions/ActionMenu';

const TAB_CONTENT: Record<ApplicationDetailTab, (application: Application) => ReactNode> = {
  overview: (a) => <OverviewTab application={a} />,
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
  const { applicationId = '' } = useParams();
  const [activeTab, selectTab] = useTabParam(APPLICATION_DETAIL_TAB_IDS);
  const query = useApplication(applicationId);

  if (query.isPending) return <LoadingState label="Loading application" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Application not found"
        description={`No application with the id "${applicationId}" exists. It may have been removed or the link may be wrong.`}
        backTo={paths.applications.list()}
        backLabel="Back to applications"
      />
    ) : (
      <ErrorState
        title="This application could not be loaded"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const application = query.data;

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Applications', to: paths.applications.list() },
          { label: application.name },
        ]}
        title={application.name}
        subtitle={application.shortDescription}
        meta={
          <>
            <span className="c-code-chip">{application.code}</span>
            <span className="c-muted">{APPLICATION_TYPE_LABELS[application.type]}</span>
            <StatusBadge context="Lifecycle:" {...LIFECYCLE_PRESENTATION[application.lifecycle]} />
            <StatusBadge
              context="Criticality:"
              {...CRITICALITY_PRESENTATION[application.criticality]}
              label={`${CRITICALITY_PRESENTATION[application.criticality].label} criticality`}
            />
            <StatusBadge
              context="Status:"
              {...OPERATIONAL_STATUS_PRESENTATION[application.operationalStatus]}
            />
          </>
        }
        actions={
          <>
            <EditAction to={paths.applications.edit(application.id)} />
            <Can permission="portfolio:edit">
              <ActionMenu
                items={[
                  { label: 'Add dependency', to: paths.dependencies.create(application.id) },
                  { label: 'Add integration', to: paths.integrations.create(application.id) },
                  {
                    label: 'Record risk',
                    to: paths.riskForms.create({ application: application.id }),
                  },
                  {
                    label: 'Raise escalation',
                    to: paths.escalationForms.create({ application: application.id }),
                  },
                  {
                    label: 'Record decision',
                    to: paths.decisionForms.create({ application: application.id }),
                  },
                ]}
              />
            </Can>
            <CopyLinkButton />
          </>
        }
      />
      <ApplicationKeyFacts application={application} />
      <AttentionNotices
        filter={{ applicationId: application.id }}
        audit={application.audit}
        entityLabel="application"
        onOpenRisks={() => selectTab('risks')}
      />
      <DetailTabs
        label="Application sections"
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
