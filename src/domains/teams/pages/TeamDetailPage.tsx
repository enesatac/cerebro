import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationList } from '@/domains/applications/api/queries';
import type { ApplicationListItem } from '@/domains/applications/types';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import type { Person } from '@/domains/people/types';
import { useProjectList } from '@/domains/projects/api/queries';
import type { ProjectListItem } from '@/domains/projects/types';
import { isNotFoundError } from '@/lib/errors';
import { useTeam } from '../api/queries';
import type { Team } from '../types';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { useMasterData } from '@/domains/master-data/context';
import { TeamDeleteAction } from '../components/TeamDeleteAction';
import { parseId } from '@/lib/urlParams';

/** Upper bound for "everything this team owns" — teams own tens, not hundreds, of systems. */
const OWNERSHIP_PAGE_SIZE = 100;

function OwnedApplications({ team }: { team: Team }) {
  const masterData = useMasterData();
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
          .map((ref) => masterData.label('teamResponsibilities', ref.responsibility))
          .join(', '),
    },
    {
      id: 'lifecycle',
      header: 'Yaşam döngüsü',
      cell: ({ row }) => <MasterBadge list="applicationLifecycles" code={row.original.lifecycle} />,
    },
    {
      id: 'criticality',
      header: 'Kritiklik',
      cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.criticality} />,
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
            getRowId={(row) => String(row.id)}
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
      cell: ({ row }) => <MasterBadge list="projectStatuses" code={row.original.status} />,
    },
    {
      id: 'health',
      header: 'Sağlık',
      cell: ({ row }) => <MasterBadge list="projectHealths" code={row.original.health} />,
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
            getRowId={(row) => String(row.id)}
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
  const navigate = useNavigate();
  const requestedId = useParams().teamId ?? '';
  // Unknown or malformed ids resolve to 0, which no sequence ever produces → "not found".
  const teamId = parseId(requestedId) ?? 0;
  const query = useTeam(teamId);
  const people = usePeopleById();

  if (query.isPending) return <LoadingState label="Ekip yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Ekip bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir ekip yok.`}
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
            <TeamDeleteAction record={team} onDeleted={() => void navigate(paths.teams.list())} />
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
