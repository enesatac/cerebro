import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationList } from '@/domains/applications/api/queries';
import type { ApplicationListItem } from '@/domains/applications/types';
import { LIFECYCLE_PRESENTATION } from '@/domains/applications/utils/applicationPresentation';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import type { Person } from '@/domains/people/types';
import { useProjectList } from '@/domains/projects/api/queries';
import type { ProjectListItem } from '@/domains/projects/types';
import {
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_STATUS_PRESENTATION,
} from '@/domains/projects/utils/projectPresentation';
import {
  CRITICALITY_PRESENTATION,
  TEAM_RESPONSIBILITY_LABELS,
} from '@/domains/shared/utils/presentation';
import { isNotFoundError } from '@/lib/errors';
import { useTeam } from '../api/queries';
import type { Team } from '../types';
import { EditAction } from '@/domains/auth/components/RecordActions';

/** Upper bound for "everything this team owns" — teams own tens, not hundreds, of systems. */
const OWNERSHIP_PAGE_SIZE = 100;

function OwnedApplications({ team }: { team: Team }) {
  const query = useApplicationList({ teamId: team.id, page: 0, pageSize: OWNERSHIP_PAGE_SIZE });
  const columns: TableColumnDef<ApplicationListItem>[] = [
    {
      id: 'name',
      header: 'Uygulama',
      width: 260,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <EntityLink to={paths.applications.detail(row.original.id)}>
            {row.original.name}
          </EntityLink>
          <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
        </span>
      ),
    },
    {
      id: 'responsibility',
      header: 'Sorumluluk',
      cell: ({ row }) =>
        row.original.teams
          .filter((ref) => ref.id === team.id)
          .map((ref) => TEAM_RESPONSIBILITY_LABELS[ref.responsibility])
          .join(', '),
    },
    {
      id: 'lifecycle',
      header: 'Yaşam döngüsü',
      cell: ({ row }) => <StatusBadge {...LIFECYCLE_PRESENTATION[row.original.lifecycle]} />,
    },
    {
      id: 'criticality',
      header: 'Kritiklik',
      cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
    },
  ];
  return (
    <QueryView
      query={query}
      loadingLabel="Uygulamalar yükleniyor"
      errorTitle="Uygulamalar yüklenemedi"
    >
      {(result) => (
        <SectionCard
          title={`Uygulamalar (${result.total})`}
          description="Bu ekibin geliştirdiği veya desteklediği uygulamalar."
        >
          <Table
            data={result.items}
            columns={columns}
            getRowId={(row) => row.id}
            emptyState={<EmptyState compact title={`${team.name} hiçbir uygulamaya atanmamış`} />}
          />
        </SectionCard>
      )}
    </QueryView>
  );
}

function DeliveredProjects({ team }: { team: Team }) {
  const query = useProjectList({ teamId: team.id, page: 0, pageSize: OWNERSHIP_PAGE_SIZE });
  const columns: TableColumnDef<ProjectListItem>[] = [
    {
      id: 'name',
      header: 'Proje',
      width: 260,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <EntityLink to={paths.projects.detail(row.original.id)}>{row.original.name}</EntityLink>
          <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Durum',
      cell: ({ row }) => <StatusBadge {...PROJECT_STATUS_PRESENTATION[row.original.status]} />,
    },
    {
      id: 'health',
      header: 'Sağlık',
      cell: ({ row }) => <StatusBadge {...PROJECT_HEALTH_PRESENTATION[row.original.health]} />,
    },
    {
      id: 'manager',
      header: 'Proje yöneticisi',
      cell: ({ row }) => row.original.projectManager?.name ?? '—',
    },
  ];
  return (
    <QueryView query={query} loadingLabel="Projeler yükleniyor" errorTitle="Projeler yüklenemedi">
      {(result) => (
        <SectionCard
          title={`Projeler (${result.total})`}
          description="Bu ekibin yürüttüğü projeler."
        >
          <Table
            data={result.items}
            columns={columns}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState compact title={`${team.name} şu anda hiçbir proje yürütmüyor`} />
            }
          />
        </SectionCard>
      )}
    </QueryView>
  );
}

function Members({ team }: { team: Team }) {
  const people = usePeopleById();
  const members = team.memberIds
    .map((id) => people.data?.get(id))
    .filter((person): person is Person => person !== undefined);
  return (
    <SectionCard title={`Üyeler (${team.memberIds.length})`}>
      {team.memberIds.length === 0 ? (
        <EmptyState compact title="Bu ekibe henüz üye eklenmedi" />
      ) : (
        <ul className="c-rule-list">
          {members.map((person) => (
            <li key={person.id} className="c-rule-list__item">
              <PersonSummary person={person} showEmail />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export default function TeamDetailPage() {
  const { teamId = '' } = useParams();
  const query = useTeam(teamId);
  const people = usePeopleById();

  if (query.isPending) return <LoadingState label="Ekip yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Ekip bulunamadı"
        description={`"${teamId}" kimliğine sahip bir ekip yok.`}
        backTo={paths.teams.list()}
        backLabel="Ekiplere dön"
      />
    ) : (
      <ErrorState title="Bu ekip yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }

  const team = query.data;
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Ekipler', to: paths.teams.list() }, { label: team.name }]}
        title={team.name}
        subtitle={team.description}
        actions={
          <>
            <EditAction to={paths.teams.edit(team.id)} />
            <CopyLinkButton />
          </>
        }
      />
      <section aria-label="Temel bilgiler" className="c-key-facts">
        <DetailList
          layout="grid"
          items={[
            {
              label: 'Yönetici',
              value: team.managerId ? (
                <PersonSummary
                  person={people.data?.get(team.managerId)}
                  fallbackId={team.managerId}
                />
              ) : null,
              emptyText: 'Atanmamış',
            },
            {
              label: 'Ekip e-posta kutusu',
              value: team.contactEmail ? (
                <a className="c-link" href={`mailto:${team.contactEmail}`}>
                  {team.contactEmail}
                </a>
              ) : null,
            },
            { label: 'Sohbet kanalı', value: team.chatChannel },
            { label: 'Sorumluluklar', value: team.responsibilities.join(' · ') },
          ]}
        />
      </section>
      <div className="c-two-column">
        <div className="c-stack">
          <OwnedApplications team={team} />
          <DeliveredProjects team={team} />
        </div>
        <Members team={team} />
      </div>
    </div>
  );
}
