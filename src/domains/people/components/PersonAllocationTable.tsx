import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMasterData } from '@/domains/master-data/context';
import { formatDateRange } from '@/lib/dates';
import type { PersonWorkload } from '../types';

type Row = PersonWorkload['allocations'][number];

/** A person's current and upcoming project allocations. */
export function PersonAllocationTable({ allocations }: { allocations: readonly Row[] }) {
  const masterData = useMasterData();
  const columns: TableColumnDef<Row>[] = [
    {
      id: 'project',
      header: 'Proje',
      width: 260,
      cell: ({ row }) => (
        <EntityLink to={paths.projects.detail(row.original.project.id)}>
          {row.original.project.name}
        </EntityLink>
      ),
    },
    {
      id: 'role',
      header: 'Rol',
      width: 160,
      cell: ({ row }) => masterData.label('stakeholderRoles', row.original.role),
    },
    {
      id: 'dates',
      header: 'Tarihler',
      cell: ({ row }) => formatDateRange(row.original.startDate, row.original.endDate),
    },
    {
      id: 'percent',
      header: 'Doluluk',
      align: 'end',
      width: 100,
      cell: ({ row }) => `%${row.original.percent}`,
    },
  ];
  return (
    <Table
      data={[...allocations]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={<EmptyState compact title="Planlanmış proje ataması yok" />}
    />
  );
}
