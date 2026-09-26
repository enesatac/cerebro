import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { QueryView } from '@/components/feedback/QueryView';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useDecisions } from '@/domains/decisions/api/queries';
import { DecisionList } from '@/domains/decisions/components/DecisionList';
import { AttentionNotices } from '@/domains/governance/components/AttentionNotices';
import { AuditHistory } from '@/domains/governance/components/AuditHistory';
import { StakeholderList } from '@/domains/people/components/StakeholderList';
import { RelatedRisksAndEscalations } from '@/domains/risks/components/RelatedRisksAndEscalations';
import { DocumentationTable } from '@/domains/shared/components/DocumentationTable';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTabParam } from '@/hooks/useTabParam';
import { isNotFoundError } from '@/lib/errors';
import { useProject } from '../api/queries';
import { ProjectApplicationsTab } from '../components/detail/ProjectApplicationsTab';
import { ProjectKeyFacts } from '../components/detail/ProjectKeyFacts';
import { ProjectMilestonesTab } from '../components/detail/ProjectMilestonesTab';
import { ProjectOverviewTab } from '../components/detail/ProjectOverviewTab';
import type { Project } from '../types';
import {
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_STATUS_PRESENTATION,
} from '../utils/projectPresentation';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { Can } from '@/domains/auth/components/Can';
import { ActionMenu } from '@/components/actions/ActionMenu';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team & Stakeholders' },
  { id: 'applications', label: 'Applications' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'risks', label: 'Risks & Escalations' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'history', label: 'History' },
] as const;
type ProjectTab = (typeof TABS)[number]['id'];
const TAB_IDS = TABS.map((tab) => tab.id);

function ProjectDecisions({ project }: { project: Project }) {
  const query = useDecisions({ projectId: project.id });
  return (
    <QueryView
      query={query}
      loadingLabel="Loading decisions"
      errorTitle="Decisions could not be loaded"
    >
      {(decisions) => (
        <SectionCard
          title="Decisions"
          description="Architecture and business decisions recorded for this project."
          actions={
            <SmallCreateAction
              to={paths.decisionForms.create({ project: project.id })}
              label="Record decision"
            />
          }
        >
          <DecisionList
            decisions={decisions}
            emptyTitle={`No decisions have been recorded for ${project.name}`}
          />
        </SectionCard>
      )}
    </QueryView>
  );
}

const TAB_CONTENT: Record<ProjectTab, (project: Project) => ReactNode> = {
  overview: (p) => <ProjectOverviewTab project={p} />,
  team: (p) => (
    <SectionCard title="Team & stakeholders" description="People and teams involved, by role.">
      <StakeholderList roles={p.roles} teams={p.teams} />
    </SectionCard>
  ),
  applications: (p) => <ProjectApplicationsTab project={p} />,
  milestones: (p) => <ProjectMilestonesTab project={p} />,
  risks: (p) => <RelatedRisksAndEscalations filter={{ projectId: p.id }} subjectName={p.name} />,
  decisions: (p) => <ProjectDecisions project={p} />,
  documentation: (p) => (
    <SectionCard title="Documentation">
      <DocumentationTable
        links={p.documentation}
        emptyTitle="No documentation has been linked to this project yet"
        emptyDescription="Link the charter, analysis and delivery board."
      />
    </SectionCard>
  ),
  history: (p) => <AuditHistory audit={p.audit} />,
};

function tabCount(tab: ProjectTab, project: Project): number | null {
  if (tab === 'applications') return project.applicationImpacts.length;
  if (tab === 'milestones') return project.milestones.length;
  if (tab === 'documentation') return project.documentation.length;
  return null;
}

export default function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  const query = useProject(projectId);

  if (query.isPending) return <LoadingState label="Loading project" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Project not found"
        description={`No project with the id "${projectId}" exists. It may have been removed or the link may be wrong.`}
        backTo={paths.projects.list()}
        backLabel="Back to projects"
      />
    ) : (
      <ErrorState title="This project could not be loaded" onRetry={() => void query.refetch()} />
    );
  }

  const project = query.data;
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Projects', to: paths.projects.list() }, { label: project.name }]}
        title={project.name}
        subtitle={project.description}
        meta={
          <>
            <span className="c-code-chip">{project.code}</span>
            <StatusBadge context="Status:" {...PROJECT_STATUS_PRESENTATION[project.status]} />
            <StatusBadge context="Health:" {...PROJECT_HEALTH_PRESENTATION[project.health]} />
            <StatusBadge
              {...CRITICALITY_PRESENTATION[project.priority]}
              label={`${CRITICALITY_PRESENTATION[project.priority].label} priority`}
            />
          </>
        }
        actions={
          <>
            <EditAction to={paths.projects.edit(project.id)} />
            <Can permission="portfolio:edit">
              <ActionMenu
                items={[
                  { label: 'Record risk', to: paths.riskForms.create({ project: project.id }) },
                  {
                    label: 'Raise escalation',
                    to: paths.escalationForms.create({ project: project.id }),
                  },
                  {
                    label: 'Record decision',
                    to: paths.decisionForms.create({ project: project.id }),
                  },
                ]}
              />
            </Can>
            <CopyLinkButton />
          </>
        }
      />
      <ProjectKeyFacts project={project} />
      <AttentionNotices
        filter={{ projectId: project.id }}
        audit={project.audit}
        entityLabel="project"
        onOpenRisks={() => selectTab('risks')}
      />
      <DetailTabs
        label="Project sections"
        tabs={TABS.map((tab) => ({ ...tab, count: tabCount(tab.id, project) }))}
        active={activeTab}
        onSelect={selectTab}
        renderPanel={(tab) => TAB_CONTENT[tab](project)}
      />
    </div>
  );
}
