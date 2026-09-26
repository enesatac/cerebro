import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/layout/Toolbar';
import { pluralize } from '@/lib/format';
import { useTeamSummaries } from '../api/queries';
import type { TeamListItem } from '../types';
import { filterTeams } from '../utils/teamFilters';
import { CreateAction } from '@/domains/auth/components/RecordActions';

const columns: TableColumnDef<TeamListItem>[] = [
  {
    id: 'name',
    header: 'Team',
    accessor: 'name',
    sortable: true,
    width: 300,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <EntityLink to={paths.teams.detail(row.original.id)}>{row.original.name}</EntityLink>
        <span className="c-muted c-cell-stack__secondary">{row.original.description}</span>
      </span>
    ),
  },
  {
    id: 'manager',
    header: 'Manager',
    accessor: (row) => row.manager?.name ?? '',
    sortable: true,
    cell: ({ row }) =>
      row.original.manager?.name ?? <span className="c-text-warning">Unassigned</span>,
  },
  { id: 'members', header: 'Members', accessor: 'memberCount', sortable: true, align: 'end' },
  {
    id: 'applications',
    header: 'Applications',
    accessor: 'applicationCount',
    sortable: true,
    align: 'end',
  },
  { id: 'projects', header: 'Projects', accessor: 'projectCount', sortable: true, align: 'end' },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        {row.original.contactEmail && (
          <a className="c-link" href={`mailto:${row.original.contactEmail}`}>
            {row.original.contactEmail}
          </a>
        )}
        <span className="c-muted c-cell-stack__secondary">{row.original.chatChannel}</span>
      </span>
    ),
  },
];

export default function TeamsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q')?.trim() ?? '';
  const query = useTeamSummaries();
  const setSearch = (value: string) =>
    setSearchParams(value ? { q: value } : {}, { replace: true });

  return (
    <>
      <PageHeader
        title="Teams"
        subtitle="Who builds and supports what — and how to reach them."
        actions={<CreateAction to={paths.teams.create()} label="Create team" />}
      />
      <QueryView query={query} loadingLabel="Loading teams" errorTitle="Teams could not be loaded">
        {(teams) => {
          const visible = filterTeams(teams, search);
          return (
            <>
              <Toolbar
                label="Filter teams"
                end={
                  <FilterSummary
                    summary={pluralize(visible.length, 'team')}
                    activeFilterCount={search ? 1 : 0}
                    onReset={() => setSearch('')}
                  />
                }
              >
                <SearchField
                  placeholder="Team name or description"
                  value={search}
                  onCommit={setSearch}
                />
              </Toolbar>
              <Table
                data={visible}
                columns={columns}
                getRowId={(row) => row.id}
                sorting={{ defaultValue: [{ id: 'name', desc: false }] }}
                emptyState={
                  <EmptyState
                    compact
                    title={
                      search ? 'No teams match this search' : 'No teams have been registered yet'
                    }
                  />
                }
              />
            </>
          );
        }}
      </QueryView>
    </>
  );
}
