import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/layout/Toolbar';
import { pluralize } from '@/lib/format';
import { useTechnologySummaries } from '../api/queries';
import { TECHNOLOGY_CATEGORIES, TECHNOLOGY_STATUSES, type TechnologyListItem } from '../types';
import {
  filterTechnologies,
  parseTechnologyFilters,
  serializeTechnologyFilters,
  type TechnologyFilterState,
} from '../utils/technologyFilters';
import {
  TECHNOLOGY_CATEGORY_LABELS,
  TECHNOLOGY_STATUS_PRESENTATION,
} from '../utils/technologyPresentation';
import { CreateAction } from '@/domains/auth/components/RecordActions';

const CATEGORY_OPTIONS = TECHNOLOGY_CATEGORIES.map((value) => ({
  value,
  label: TECHNOLOGY_CATEGORY_LABELS[value],
}));
const STATUS_OPTIONS = TECHNOLOGY_STATUSES.map((value) => ({
  value,
  label: TECHNOLOGY_STATUS_PRESENTATION[value].label,
}));

const columns: TableColumnDef<TechnologyListItem>[] = [
  {
    id: 'name',
    header: 'Technology',
    accessor: 'name',
    sortable: true,
    width: 220,
    cell: ({ row }) => (
      <EntityLink to={paths.technologies.detail(row.original.id)}>{row.original.name}</EntityLink>
    ),
  },
  {
    id: 'category',
    header: 'Category',
    accessor: 'category',
    sortable: true,
    width: 140,
    cell: ({ row }) => TECHNOLOGY_CATEGORY_LABELS[row.original.category],
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => TECHNOLOGY_STATUSES.indexOf(row.status),
    sortable: true,
    width: 120,
    cell: ({ row }) => <StatusBadge {...TECHNOLOGY_STATUS_PRESENTATION[row.original.status]} />,
  },
  { id: 'description', header: 'Description', accessor: 'description' },
  {
    id: 'usage',
    header: 'Used by',
    accessor: 'applicationCount',
    sortable: true,
    align: 'end',
    width: 130,
    cell: ({ row }) => pluralize(row.original.applicationCount, 'application'),
  },
];

export default function TechnologiesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTechnologyFilters(searchParams);
  const query = useTechnologySummaries();
  const update = (patch: Partial<TechnologyFilterState>) =>
    setSearchParams(serializeTechnologyFilters({ ...filters, ...patch }), { replace: true });
  const activeFilters = [filters.search, filters.category, filters.status].filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Technologies"
        subtitle="The technology catalogue, its organisational status and where each technology is used."
        actions={<CreateAction to={paths.technologies.create()} label="Add technology" />}
      />
      <QueryView
        query={query}
        loadingLabel="Loading technologies"
        errorTitle="Technologies could not be loaded"
      >
        {(technologies) => {
          const visible = filterTechnologies(technologies, filters);
          return (
            <>
              <Toolbar
                label="Filter technologies"
                end={
                  <FilterSummary
                    summary={pluralize(visible.length, 'technology', 'technologies')}
                    activeFilterCount={activeFilters}
                    onReset={() => update({ search: '', category: null, status: null })}
                  />
                }
              >
                <SearchField
                  placeholder="Name or description"
                  value={filters.search}
                  onCommit={(search) => update({ search })}
                />
                <FilterSelect
                  label="Category"
                  allLabel="All categories"
                  value={filters.category}
                  options={CATEGORY_OPTIONS}
                  onChange={(value) =>
                    update({ category: value as TechnologyFilterState['category'] })
                  }
                />
                <FilterSelect
                  label="Status"
                  allLabel="All statuses"
                  value={filters.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => update({ status: value as TechnologyFilterState['status'] })}
                />
              </Toolbar>
              <Table
                data={visible}
                columns={columns}
                getRowId={(row) => row.id}
                sorting={{ defaultValue: [{ id: 'name', desc: false }] }}
                pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
                emptyState={<EmptyState compact title="No technologies match these filters" />}
              />
            </>
          );
        }}
      </QueryView>
    </>
  );
}
