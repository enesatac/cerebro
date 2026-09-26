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
      header: 'Application',
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
      header: 'Responsibility',
      cell: ({ row }) =>
        row.original.teams
          .filter((ref) => ref.id === team.id)
          .map((ref) => TEAM_RESPONSIBILITY_LABELS[ref.responsibility])
          .join(', '),
    },
    {
      id: 'lifecycle',
      header: 'Lifecycle',
      cell: ({ row }) => <StatusBadge {...LIFECYCLE_PRESENTATION[row.original.lifecycle]} />,
    },
    {
      id: 'criticality',
      header: 'Criticality',
      cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
    },
  ];
  return (
    <QueryView
      query={query}
      loadingLabel="Loading applications"
      errorTitle="Applications could not be loaded"
    >
      {(result) => (
        <SectionCard
          title={`Applications (${result.total})`}
          description="Applications this team develops or supports."
        >
          <Table
            data={result.items}
            columns={columns}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState compact title={`${team.name} is not assigned to any application`} />
            }
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
      header: 'Project',
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
      header: 'Status',
      cell: ({ row }) => <StatusBadge {...PROJECT_STATUS_PRESENTATION[row.original.status]} />,
    },
    {
      id: 'health',
      header: 'Health',
      cell: ({ row }) => <StatusBadge {...PROJECT_HEALTH_PRESENTATION[row.original.health]} />,
    },
    {
      id: 'manager',
      header: 'Project manager',
      cell: ({ row }) => row.original.projectManager?.name ?? '—',
    },
  ];
  return (
    <QueryView
      query={query}
      loadingLabel="Loading projects"
      errorTitle="Projects could not be loaded"
    >
      {(result) => (
        <SectionCard
          title={`Projects (${result.total})`}
          description="Projects this team delivers."
        >
          <Table
            data={result.items}
            columns={columns}
            getRowId={(row) => row.id}
            emptyState={<EmptyState compact title={`${team.name} is not delivering any project`} />}
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
    <SectionCard title={`Members (${team.memberIds.length})`}>
      {team.memberIds.length === 0 ? (
        <EmptyState compact title="No members have been added to this team yet" />
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

  if (query.isPending) return <LoadingState label="Loading team" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Team not found"
        description={`No team with the id "${teamId}" exists.`}
        backTo={paths.teams.list()}
        backLabel="Back to teams"
      />
    ) : (
      <ErrorState title="This team could not be loaded" onRetry={() => void query.refetch()} />
    );
  }

  const team = query.data;
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Teams', to: paths.teams.list() }, { label: team.name }]}
        title={team.name}
        subtitle={team.description}
        actions={
          <>
            <EditAction to={paths.teams.edit(team.id)} />
            <CopyLinkButton />
          </>
        }
      />
      <section aria-label="Key facts" className="c-key-facts">
        <DetailList
          layout="grid"
          items={[
            {
              label: 'Manager',
              value: team.managerId ? (
                <PersonSummary
                  person={people.data?.get(team.managerId)}
                  fallbackId={team.managerId}
                />
              ) : null,
              emptyText: 'Unassigned',
            },
            {
              label: 'Team mailbox',
              value: team.contactEmail ? (
                <a className="c-link" href={`mailto:${team.contactEmail}`}>
                  {team.contactEmail}
                </a>
              ) : null,
            },
            { label: 'Chat channel', value: team.chatChannel },
            { label: 'Responsibilities', value: team.responsibilities.join(' · ') },
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
