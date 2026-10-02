import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
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
  const masterData = useMasterData();
  const milestones = [...project.milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
    <SectionCard
      title="Kilometre taşları"
      actions={
        <ExcelExportButton
          title={`${project.name} — kilometre taşları`}
          disabled={milestones.length === 0}
          build={() => [
            sheet<Milestone>({
              name: 'Kilometre taşları',
              title: `${project.name} — kilometre taşları`,
              rows: milestones,
              columns: [
                { header: 'Kilometre taşı', value: (m) => m.title },
                { header: 'Durum', value: (m) => masterData.label('milestoneStatuses', m.status) },
                { header: 'Termin', value: (m) => m.dueDate, type: 'date' },
                { header: 'Tamamlandı', value: (m) => m.completedDate, type: 'date' },
                { header: 'Gecikmiş', value: (m) => isOverdue(m, today) },
              ],
            }),
          ]}
        />
      }
    >
      <Table
        data={milestones}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={<EmptyState compact title="Bu proje için henüz kilometre taşı tanımlanmadı" />}
      />
    </SectionCard>
  );
}
