import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { formatDate, toIsoDate } from '@/lib/dates';
import type { Milestone, Project } from '../../types';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';

function isOverdue(milestone: Milestone, today: string): boolean {
  return milestone.status !== 'completed' && milestone.dueDate < today;
}

export function ProjectMilestonesTab({ project }: { project: Project }) {
  const today = toIsoDate(new Date());
  const columns: TableColumnDef<Milestone>[] = [
    { id: 'title', header: 'Kilometre taşı', accessor: 'title', width: 280 },
    {
      id: 'status',
      header: 'Durum',
      cell: ({ row }) => <MasterBadge list="milestoneStatuses" code={row.original.status} />,
    },
    {
      id: 'due',
      header: 'Termin',
      cell: ({ row }) =>
        isOverdue(row.original, today) ? (
          <span className="c-text-warning">{formatDate(row.original.dueDate)} · gecikmiş</span>
        ) : (
          formatDate(row.original.dueDate)
        ),
    },
    {
      id: 'completed',
      header: 'Tamamlandı',
      align: 'end',
      cell: ({ row }) => formatDate(row.original.completedDate),
    },
  ];

  return (
    <SectionCard title="Kilometre taşları">
      <Table
        data={[...project.milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate))}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={<EmptyState compact title="Bu proje için henüz kilometre taşı tanımlanmadı" />}
      />
    </SectionCard>
  );
}
