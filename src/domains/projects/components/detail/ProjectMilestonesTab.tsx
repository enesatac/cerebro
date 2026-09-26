import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { formatDate, toIsoDate } from '@/lib/dates';
import type { Milestone, Project } from '../../types';
import { MILESTONE_STATUS_PRESENTATION } from '../../utils/projectPresentation';

function isOverdue(milestone: Milestone, today: string): boolean {
  return milestone.status !== 'completed' && milestone.dueDate < today;
}

export function ProjectMilestonesTab({ project }: { project: Project }) {
  const today = toIsoDate(new Date());
  const columns: TableColumnDef<Milestone>[] = [
    { id: 'title', header: 'Milestone', accessor: 'title', width: 280 },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge {...MILESTONE_STATUS_PRESENTATION[row.original.status]} />,
    },
    {
      id: 'due',
      header: 'Due',
      cell: ({ row }) =>
        isOverdue(row.original, today) ? (
          <span className="c-text-warning">{formatDate(row.original.dueDate)} · overdue</span>
        ) : (
          formatDate(row.original.dueDate)
        ),
    },
    {
      id: 'completed',
      header: 'Completed',
      align: 'end',
      cell: ({ row }) => formatDate(row.original.completedDate),
    },
  ];

  return (
    <SectionCard title="Milestones">
      <Table
        data={[...project.milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate))}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState compact title="No milestones have been defined for this project yet" />
        }
      />
    </SectionCard>
  );
}
