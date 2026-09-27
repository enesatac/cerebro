import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
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
import { useTabParam } from '@/hooks/useTabParam';
import { isNotFoundError } from '@/lib/errors';
import { useProject } from '../api/queries';
import { ProjectApplicationsTab } from '../components/detail/ProjectApplicationsTab';
import { ProjectKeyFacts } from '../components/detail/ProjectKeyFacts';
import { ProjectMilestonesTab } from '../components/detail/ProjectMilestonesTab';
import { ProjectOverviewTab } from '../components/detail/ProjectOverviewTab';
import type { Project } from '../types';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { Can } from '@/domains/auth/components/Can';
import { ActionMenu } from '@/components/actions/ActionMenu';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { ProjectDeleteAction } from '../components/ProjectDeleteAction';
import { parseId } from '@/lib/urlParams';

const TABS = [
  { id: 'overview', label: 'Genel bakış' },
  { id: 'team', label: 'Ekip ve Paydaşlar' },
  { id: 'applications', label: 'Uygulamalar' },
  { id: 'milestones', label: 'Kilometre taşları' },
  { id: 'risks', label: 'Riskler ve Eskalasyonlar' },
  { id: 'decisions', label: 'Kararlar' },
  { id: 'documentation', label: 'Dokümantasyon' },
  { id: 'history', label: 'Geçmiş' },
] as const;
type ProjectTab = (typeof TABS)[number]['id'];
const TAB_IDS = TABS.map((tab) => tab.id);

function ProjectDecisions({ project }: { project: Project }) {
  const query = useDecisions({ projectId: project.id });
  return (
    <QueryView query={query} loadingLabel="Kararlar yükleniyor" errorTitle="Kararlar yüklenemedi">
      {(decisions) => (
        <SectionCard
          title="Kararlar"
          description="Bu proje için kaydedilmiş mimari ve iş kararları."
          actions={
            <SmallCreateAction
              to={paths.decisionForms.create({ project: project.id })}
              label="Karar kaydet"
            />
          }
        >
          <DecisionList
            decisions={decisions}
            emptyTitle={`${project.name} için kaydedilmiş karar yok`}
          />
        </SectionCard>
      )}
    </QueryView>
  );
}

const TAB_CONTENT: Record<ProjectTab, (project: Project) => ReactNode> = {
  overview: (p) => <ProjectOverviewTab project={p} />,
  team: (p) => (
    <SectionCard title="Ekip ve paydaşlar" description="Role göre dahil olan kişiler ve ekipler.">
      <StakeholderList roles={p.roles} teams={p.teams} />
    </SectionCard>
  ),
  applications: (p) => <ProjectApplicationsTab project={p} />,
  milestones: (p) => <ProjectMilestonesTab project={p} />,
  risks: (p) => <RelatedRisksAndEscalations filter={{ projectId: p.id }} subjectName={p.name} />,
  decisions: (p) => <ProjectDecisions project={p} />,
  documentation: (p) => (
    <SectionCard title="Dokümantasyon">
      <DocumentationTable
        links={p.documentation}
        emptyTitle="Bu projeye henüz dokümantasyon bağlanmadı"
        emptyDescription="Proje beratını, analizi ve teslimat panosunu bağlayın."
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
  const navigate = useNavigate();
  const requestedId = useParams().projectId ?? '';
  // Unknown or malformed ids resolve to 0, which no sequence ever produces → "not found".
  const projectId = parseId(requestedId) ?? 0;
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  const query = useProject(projectId);

  if (query.isPending) return <LoadingState label="Proje yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Proje bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir proje yok. Kaldırılmış ya da bağlantı hatalı olabilir.`}
        backTo={paths.projects.list()}
        backLabel="Projelere dön"
      />
    ) : (
      <ErrorState title="Bu proje yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }

  const project = query.data;
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Projeler', to: paths.projects.list() }, { label: project.name }]}
        title={project.name}
        subtitle={project.description}
        meta={
          <>
            <span className="c-code-chip">{project.code}</span>
            <MasterBadge list="projectStatuses" code={project.status} context="Durum:" />
            <MasterBadge list="projectHealths" code={project.health} context="Sağlık:" />
            <MasterBadge
              list="criticalities"
              code={project.priority}
              format={(label) => `${label} öncelik`}
            />
          </>
        }
        actions={
          <>
            <EditAction to={paths.projects.edit(project.id)} />
            <ProjectDeleteAction
              record={project}
              onDeleted={() => void navigate(paths.projects.list())}
            />
            <Can permission="portfolio:edit">
              <ActionMenu
                items={[
                  { label: 'Risk kaydet', to: paths.riskForms.create({ project: project.id }) },
                  {
                    label: 'Eskalasyon aç',
                    to: paths.escalationForms.create({ project: project.id }),
                  },
                  {
                    label: 'Karar kaydet',
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
        entityLabel="proje"
        onOpenRisks={() => selectTab('risks')}
      />
      <DetailTabs
        label="Proje bölümleri"
        tabs={TABS.map((tab) => ({ ...tab, count: tabCount(tab.id, project) }))}
        active={activeTab}
        onSelect={selectTab}
        renderPanel={(tab) => TAB_CONTENT[tab](project)}
      />
    </div>
  );
}
