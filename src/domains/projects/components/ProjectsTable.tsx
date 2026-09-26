import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import type { PagedResult, SortSpec } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { formatDate } from '@/lib/dates';
import { PROJECT_SORT_FIELDS, type ProjectListItem, type ProjectSortField } from '../types';
import {
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_PRESENTATION,
} from '../utils/projectPresentation';
import { PROJECT_PAGE_SIZES } from '../utils/projectListParams';
import { PercentMeter } from '@/components/data-display/PercentMeter';

const isSortField = (id: string): id is ProjectSortField =>
  (PROJECT_SORT_FIELDS as readonly string[]).includes(id);

const columns: TableColumnDef<ProjectListItem>[] = [
  {
    id: 'name',
    header: 'Proje',
    accessor: 'name',
    sortable: true,
    width: 250,
    cell: ({ row }) => (
      <div className="c-cell-stack">
        <EntityLink to={paths.projects.detail(row.original.id)}>{row.original.name}</EntityLink>
        <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Durum',
    accessor: 'status',
    sortable: true,
    width: 115,
    cell: ({ row }) => <StatusBadge {...PROJECT_STATUS_PRESENTATION[row.original.status]} />,
  },
  {
    id: 'health',
    header: 'Sağlık',
    accessor: 'health',
    sortable: true,
    width: 105,
    cell: ({ row }) => <StatusBadge {...PROJECT_HEALTH_PRESENTATION[row.original.health]} />,
  },
  {
    id: 'priority',
    header: 'Öncelik',
    accessor: 'priority',
    sortable: true,
    width: 100,
    cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.priority]} />,
  },
  {
    id: 'progress',
    header: 'İlerleme',
    width: 150,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <PercentMeter
          value={row.original.progressPercentage}
          label={`${row.original.name} ilerleme`}
        />
        <span className="c-muted c-cell-stack__secondary">
          {PROJECT_PHASE_LABELS[row.original.currentPhase]}
        </span>
      </span>
    ),
  },
  {
    id: 'businessUnit',
    header: 'İş birimi',
    width: 150,
    cell: ({ row }) =>
      row.original.businessUnit?.name ?? <span className="c-muted">Belirlenmemiş</span>,
  },
  {
    id: 'projectManager',
    header: 'Proje yöneticisi',
    width: 150,
    cell: ({ row }) =>
      row.original.projectManager?.name ?? <span className="c-text-warning">Atanmamış</span>,
  },
  {
    id: 'plannedEndDate',
    header: 'Planlanan bitiş',
    accessor: 'plannedEndDate',
    sortable: true,
    align: 'end',
    width: 115,
    cell: ({ row }) => formatDate(row.original.plannedEndDate),
  },
];

interface ProjectsTableProps {
  result: PagedResult<ProjectListItem> | undefined;
  sort: SortSpec<ProjectSortField>;
  onSortChange: (sort: SortSpec<ProjectSortField> | null) => void;
  onPageChange: (page: number, pageSize: number) => void;
  loading: boolean;
  emptyState: ReactNode;
}

export function ProjectsTable({
  result,
  sort,
  onSortChange,
  onPageChange,
  loading,
  emptyState,
}: ProjectsTableProps) {
  return (
    <Table
      data={result?.items ?? []}
      columns={columns}
      getRowId={(row) => row.id}
      manual
      loading={loading}
      emptyState={emptyState}
      sorting={{
        value: [{ id: sort.field, desc: sort.direction === 'desc' }],
        onChange: (next) => {
          const first = next[0];
          onSortChange(
            first && isSortField(first.id)
              ? { field: first.id, direction: first.desc ? 'desc' : 'asc' }
              : null,
          );
        },
      }}
      pagination={{
        pageIndex: result?.page ?? 0,
        pageSize: result?.pageSize ?? PROJECT_PAGE_SIZES[1],
        pageSizeOptions: [...PROJECT_PAGE_SIZES],
        rowCount: result?.total ?? 0,
        onChange: ({ pageIndex, pageSize }) => onPageChange(pageIndex, pageSize),
      }}
    />
  );
}
