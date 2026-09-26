import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo, type ReactNode } from 'react';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import type { PagedResult, SortSpec } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { formatRelative } from '@/lib/dates';
import {
  APPLICATION_SORT_FIELDS,
  type ApplicationListItem,
  type ApplicationSortField,
} from '../types';
import {
  LIFECYCLE_PRESENTATION,
  OPERATIONAL_STATUS_PRESENTATION,
} from '../utils/applicationPresentation';
import { APPLICATION_PAGE_SIZES } from '../utils/applicationListParams';
import { getPrimaryTeams } from '../utils/applicationTeams';

interface ApplicationsTableProps {
  result: PagedResult<ApplicationListItem> | undefined;
  sort: SortSpec<ApplicationSortField>;
  onSortChange: (sort: SortSpec<ApplicationSortField> | null) => void;
  onPageChange: (page: number, pageSize: number) => void;
  loading: boolean;
  emptyState: ReactNode;
}

const isSortField = (id: string): id is ApplicationSortField =>
  (APPLICATION_SORT_FIELDS as readonly string[]).includes(id);

function buildColumns(now: Date): TableColumnDef<ApplicationListItem>[] {
  return [
    {
      id: 'name',
      header: 'Uygulama',
      width: 250,
      accessor: 'name',
      sortable: true,
      cell: ({ row }) => (
        <div className="c-cell-stack">
          <EntityLink to={paths.applications.detail(row.original.id)}>
            {row.original.name}
          </EntityLink>
          <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
        </div>
      ),
    },
    {
      id: 'lifecycle',
      width: 110,
      header: 'Yaşam döngüsü',
      accessor: 'lifecycle',
      sortable: true,
      cell: ({ row }) => <StatusBadge {...LIFECYCLE_PRESENTATION[row.original.lifecycle]} />,
    },
    {
      id: 'criticality',
      width: 100,
      header: 'Kritiklik',
      accessor: 'criticality',
      sortable: true,
      cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
    },
    {
      id: 'operationalStatus',
      width: 115,
      header: 'Durum',
      cell: ({ row }) => (
        <StatusBadge {...OPERATIONAL_STATUS_PRESENTATION[row.original.operationalStatus]} />
      ),
    },
    {
      id: 'businessUnit',
      width: 150,
      header: 'İş birimi',
      accessor: (row) => row.businessUnit?.name ?? '',
      sortable: true,
      cell: ({ row }) =>
        row.original.businessUnit?.name ?? <span className="c-muted">Belirlenmemiş</span>,
    },
    {
      id: 'technicalOwner',
      width: 150,
      header: 'Teknik sahip',
      accessor: (row) => row.technicalOwner?.name ?? '',
      sortable: true,
      cell: ({ row }) =>
        row.original.technicalOwner?.name ?? <span className="c-text-warning">Atanmamış</span>,
    },
    {
      id: 'team',
      header: 'Ekip',
      width: 165,
      cell: ({ row }) => {
        const teams = getPrimaryTeams(row.original.teams);
        return teams.length > 0 ? (
          teams.map((team) => team.name).join(', ')
        ) : (
          <span className="c-muted">Yok</span>
        );
      },
    },
    {
      id: 'updatedAt',
      width: 105,
      header: 'Güncellendi',
      accessor: 'updatedAt',
      sortable: true,
      align: 'end',
      cell: ({ row }) => formatRelative(row.original.updatedAt, now),
    },
  ];
}

/** Server-driven (manual) Takeoff Table: the repository owns filtering, sorting and paging. */
export function ApplicationsTable({
  result,
  sort,
  onSortChange,
  onPageChange,
  loading,
  emptyState,
}: ApplicationsTableProps) {
  const columns = useMemo(() => buildColumns(new Date()), []);

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
        pageSize: result?.pageSize ?? APPLICATION_PAGE_SIZES[1],
        pageSizeOptions: [...APPLICATION_PAGE_SIZES],
        rowCount: result?.total ?? 0,
        onChange: ({ pageIndex, pageSize }) => onPageChange(pageIndex, pageSize),
      }}
    />
  );
}
