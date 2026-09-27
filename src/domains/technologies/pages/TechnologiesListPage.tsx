import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/layout/Toolbar';
import { pluralize } from '@/lib/format';
import { useTechnologySummaries } from '../api/queries';
import { TECHNOLOGY_STATUSES, type TechnologyListItem } from '../types';
import {
  filterTechnologies,
  parseTechnologyFilters,
  serializeTechnologyFilters,
  type TechnologyFilterState,
} from '../utils/technologyFilters';
import { CreateAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useMasterData } from '@/domains/master-data/context';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { TechnologyDeleteAction } from '../components/TechnologyDeleteAction';

const columns: TableColumnDef<TechnologyListItem>[] = [
  {
    id: 'name',
    header: 'Teknoloji',
    accessor: 'name',
    sortable: true,
    width: 220,
    cell: ({ row }) => (
      <EntityLink to={paths.technologies.detail(row.original.id)}>{row.original.name}</EntityLink>
    ),
  },
  {
    id: 'category',
    header: 'Kategori',
    accessor: 'category',
    sortable: true,
    width: 140,
    cell: ({ row }) => <MasterLabel list="technologyCategories" code={row.original.category} />,
  },
  {
    id: 'status',
    header: 'Durum',
    accessor: (row) => TECHNOLOGY_STATUSES.indexOf(row.status),
    sortable: true,
    width: 120,
    cell: ({ row }) => <MasterBadge list="technologyStatuses" code={row.original.status} />,
  },
  { id: 'description', header: 'Açıklama', accessor: 'description' },
  {
    id: 'usage',
    header: 'Kullananlar',
    accessor: 'applicationCount',
    sortable: true,
    align: 'end',
    width: 130,
    cell: ({ row }) => pluralize(row.original.applicationCount, 'uygulama'),
  },
];

const actionsColumn = editColumn<TechnologyListItem>(
  (technology) => paths.technologies.edit(technology.id),
  (technology) => technology.name,
  (technology) => <TechnologyDeleteAction record={technology} compact />,
);

export default function TechnologiesListPage() {
  const canEdit = usePermission('portfolio:edit');
  const masterData = useMasterData();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTechnologyFilters(searchParams);
  const query = useTechnologySummaries();
  const update = (patch: Partial<TechnologyFilterState>) =>
    setSearchParams(serializeTechnologyFilters({ ...filters, ...patch }), { replace: true });
  const activeFilters = [filters.search, filters.category, filters.status].filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Teknolojiler"
        subtitle="Teknoloji kataloğu, kurum içi durumları ve her teknolojinin nerede kullanıldığı."
        actions={<CreateAction to={paths.technologies.create()} label="Teknoloji ekle" />}
      />
      <QueryView
        query={query}
        loadingLabel="Teknolojiler yükleniyor"
        errorTitle="Teknolojiler yüklenemedi"
      >
        {(technologies) => {
          const visible = filterTechnologies(technologies, filters);
          return (
            <>
              <Toolbar
                label="Teknolojileri filtrele"
                end={
                  <FilterSummary
                    summary={pluralize(visible.length, 'teknoloji')}
                    activeFilterCount={activeFilters}
                    onReset={() => update({ search: '', category: null, status: null })}
                  />
                }
              >
                <SearchField
                  placeholder="Ad veya açıklama"
                  value={filters.search}
                  onCommit={(search) => update({ search })}
                />
                <FilterSelect
                  label="Kategori"
                  allLabel="Tüm kategoriler"
                  value={filters.category}
                  options={masterData.options('technologyCategories', filters.category)}
                  onChange={(value) =>
                    update({ category: value as TechnologyFilterState['category'] })
                  }
                />
                <FilterSelect
                  label="Durum"
                  allLabel="Tüm durumlar"
                  value={filters.status}
                  options={masterData.options('technologyStatuses', filters.status)}
                  onChange={(value) => update({ status: value as TechnologyFilterState['status'] })}
                />
              </Toolbar>
              <Table
                data={visible}
                columns={canEdit ? [...columns, actionsColumn] : columns}
                getRowId={(row) => String(row.id)}
                sorting={{ defaultValue: [{ id: 'name', desc: false }] }}
                pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
                emptyState={<EmptyState compact title="Bu filtrelere uyan teknoloji yok" />}
              />
            </>
          );
        }}
      </QueryView>
    </>
  );
}
