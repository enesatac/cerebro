import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { sheet } from '@/lib/xlsxTypes';
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
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { TeamDeleteAction } from '../components/TeamDeleteAction';

const columns: TableColumnDef<TeamListItem>[] = [
  {
    id: 'name',
    header: 'Ekip',
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
    header: 'Yönetici',
    accessor: (row) => row.manager?.name ?? '',
    sortable: true,
    cell: ({ row }) =>
      row.original.manager ? (
        <EntityLink to={paths.people.detail(row.original.manager.id)}>
          {row.original.manager.name}
        </EntityLink>
      ) : (
        <span className="c-text-warning">Atanmamış</span>
      ),
  },
  { id: 'members', header: 'Üyeler', accessor: 'memberCount', sortable: true, align: 'end' },
  {
    id: 'applications',
    header: 'Uygulamalar',
    accessor: 'applicationCount',
    sortable: true,
    align: 'end',
  },
  { id: 'projects', header: 'Projeler', accessor: 'projectCount', sortable: true, align: 'end' },
  {
    id: 'contact',
    header: 'İletişim',
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

const actionsColumn = editColumn<TeamListItem>(
  (team) => paths.teams.edit(team.id),
  (team) => team.name,
  (team) => <TeamDeleteAction record={team} compact />,
);

export default function TeamsListPage() {
  const canEdit = usePermission('portfolio:edit');
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q')?.trim() ?? '';
  const query = useTeamSummaries();
  const setSearch = (value: string) =>
    setSearchParams(value ? { q: value } : {}, { replace: true });
  const visibleTeams = query.data ? filterTeams(query.data, search) : [];
  const exportSheets = () => [
    sheet<TeamListItem>({
      name: 'Ekipler',
      title: 'Ekipler',
      subtitle: search ? `Arama: ${search}` : 'Filtre yok',
      rows: [...visibleTeams].sort((a, b) => a.name.localeCompare(b.name, 'tr')),
      columns: [
        { header: 'Ekip', value: (t) => t.name },
        { header: 'Açıklama', value: (t) => t.description, width: 50 },
        { header: 'Yönetici', value: (t) => t.manager?.name },
        { header: 'Üye sayısı', value: (t) => t.memberCount, type: 'integer' },
        { header: 'Uygulama sayısı', value: (t) => t.applicationCount, type: 'integer' },
        { header: 'Proje sayısı', value: (t) => t.projectCount, type: 'integer' },
        { header: 'Ekip e-posta kutusu', value: (t) => t.contactEmail },
        { header: 'Sohbet kanalı', value: (t) => t.chatChannel },
      ],
    }),
  ];

  return (
    <>
      <PageHeader
        title="Ekipler"
        subtitle="Kim neyi geliştiriyor ve destekliyor — ve onlara nasıl ulaşılır."
        actions={
          <>
            <ExcelExportButton
              title="Ekipler"
              build={exportSheets}
              disabled={visibleTeams.length === 0}
            />
            <CreateAction to={paths.teams.create()} label="Ekip oluştur" />
          </>
        }
      />
      <QueryView query={query} loadingLabel="Ekipler yükleniyor" errorTitle="Ekipler yüklenemedi">
        {(teams) => {
          const visible = filterTeams(teams, search);
          return (
            <>
              <Toolbar
                label="Ekipleri filtrele"
                end={
                  <FilterSummary
                    summary={pluralize(visible.length, 'ekip')}
                    activeFilterCount={search ? 1 : 0}
                    onReset={() => setSearch('')}
                  />
                }
              >
                <SearchField
                  placeholder="Ekip adı veya açıklama"
                  value={search}
                  onCommit={setSearch}
                />
              </Toolbar>
              <Table
                data={visible}
                columns={canEdit ? [...columns, actionsColumn] : columns}
                getRowId={(row) => String(row.id)}
                sorting={{ defaultValue: [{ id: 'name', desc: false }] }}
                emptyState={
                  <EmptyState
                    compact
                    title={search ? 'Bu aramaya uyan ekip yok' : 'Henüz kayıtlı ekip yok'}
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
