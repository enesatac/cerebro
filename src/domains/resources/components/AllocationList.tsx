import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMasterData } from '@/domains/master-data/context';
import type { EntityId, EntityRef } from '@/domains/shared/types';
import { formatDateRange } from '@/lib/dates';
import type { Allocation } from '../types';
import { AllocationDeleteAction } from './AllocationDeleteAction';
import type { PlanRow } from './ResourceTimeline';

interface ListRow {
  allocation: Allocation;
  personName: string;
  projectName: string;
}

interface AllocationListProps {
  rows: readonly PlanRow[];
  projects: ReadonlyMap<EntityId, EntityRef>;
  canEdit: boolean;
  onEdit: (allocation: Allocation) => void;
}

/** The planner's allocations as a sortable table — the text alternative to the timeline. */
export function AllocationList({ rows, projects, canEdit, onEdit }: AllocationListProps) {
  const masterData = useMasterData();
  const data: ListRow[] = rows.flatMap(({ person, allocations }) =>
    allocations.map((allocation) => ({
      allocation,
      personName: person.fullName,
      projectName: projects.get(allocation.projectId)?.name ?? 'Silinmiş proje',
    })),
  );
  const columns: TableColumnDef<ListRow>[] = [
    {
      id: 'person',
      header: 'Kişi',
      accessor: 'personName',
      sortable: true,
      width: 190,
      cell: ({ row }) => (
        <EntityLink to={paths.people.detail(row.original.allocation.personId)}>
          {row.original.personName}
        </EntityLink>
      ),
    },
    {
      id: 'project',
      header: 'Proje',
      accessor: 'projectName',
      sortable: true,
      width: 240,
      cell: ({ row }) => (
        <EntityLink to={paths.projects.detail(row.original.allocation.projectId)}>
          {row.original.projectName}
        </EntityLink>
      ),
    },
    {
      id: 'role',
      header: 'Rol',
      width: 150,
      cell: ({ row }) => masterData.label('stakeholderRoles', row.original.allocation.role),
    },
    {
      id: 'dates',
      header: 'Tarihler',
      accessor: (row) => row.allocation.startDate,
      sortable: true,
      width: 200,
      cell: ({ row }) =>
        formatDateRange(row.original.allocation.startDate, row.original.allocation.endDate),
    },
    {
      id: 'percent',
      header: 'Doluluk',
      accessor: (row) => row.allocation.percent,
      sortable: true,
      align: 'end',
      width: 100,
      cell: ({ row }) => `%${row.original.allocation.percent}`,
    },
    ...(canEdit
      ? [
          {
            id: 'actions',
            header: <span className="c-visually-hidden">İşlemler</span>,
            align: 'end',
            width: 110,
            cell: ({ row }) => (
              <span className="c-row-actions">
                <Button
                  size="small"
                  variant="neutral"
                  appearance="text"
                  startContent={<EditIconOutlinedRounded aria-hidden="true" />}
                  aria-label={`Düzenle: ${row.original.personName} — ${row.original.projectName}`}
                  onClick={() => onEdit(row.original.allocation)}
                />
                <AllocationDeleteAction
                  record={row.original.allocation}
                  description={`${row.original.personName} — ${row.original.projectName}`}
                  compact
                />
              </span>
            ),
          } satisfies TableColumnDef<ListRow>,
        ]
      : []),
  ];
  return (
    <Table
      data={data}
      columns={columns}
      getRowId={(row) => String(row.allocation.id)}
      pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
      emptyState={
        <EmptyState
          compact
          title="Bu dönemde atama yok"
          description="Başka bir dönem seçin veya filtreleri gevşetin."
        />
      }
    />
  );
}
