import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { formatDateRange } from '@/lib/dates';
import type { LeaveRecord } from '../types';
import { workingDays } from '../utils/leaveCalendar';
import { LeaveDeleteAction } from './LeaveDeleteAction';
import type { TimelineRow } from './LeaveTimeline';

interface ListRow {
  leave: LeaveRecord;
  personName: string;
  jobTitle: string;
}

interface LeaveListProps {
  rows: readonly TimelineRow[];
  canEdit: boolean;
  onEdit: (leave: LeaveRecord) => void;
}

/** The same leaves as the calendar, as a sortable table (and the keyboard-friendly route). */
export function LeaveList({ rows, canEdit, onEdit }: LeaveListProps) {
  const data: ListRow[] = rows
    .flatMap(({ person, leaves }) =>
      leaves.map((leave) => ({ leave, personName: person.fullName, jobTitle: person.jobTitle })),
    )
    .sort((a, b) => a.leave.startDate.localeCompare(b.leave.startDate));

  const columns: TableColumnDef<ListRow>[] = [
    {
      id: 'person',
      header: 'Kişi',
      accessor: 'personName',
      sortable: true,
      width: 220,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>{row.original.personName}</span>
          <span className="c-muted c-cell-stack__secondary">{row.original.jobTitle}</span>
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Tür',
      width: 170,
      cell: ({ row }) => <MasterBadge list="leaveTypes" code={row.original.leave.type} />,
    },
    {
      id: 'dates',
      header: 'Tarihler',
      accessor: (row) => row.leave.startDate,
      sortable: true,
      width: 210,
      cell: ({ row }) => formatDateRange(row.original.leave.startDate, row.original.leave.endDate),
    },
    {
      id: 'days',
      header: 'İş günü',
      accessor: (row) => workingDays(row.leave.startDate, row.leave.endDate),
      sortable: true,
      align: 'end',
      width: 90,
    },
    { id: 'note', header: 'Not', cell: ({ row }) => row.original.leave.note || '—' },
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
                  aria-label={`Düzenle: ${row.original.personName} izni`}
                  onClick={() => onEdit(row.original.leave)}
                />
                <LeaveDeleteAction
                  record={row.original.leave}
                  personName={row.original.personName}
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
      getRowId={(row) => String(row.leave.id)}
      pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
      emptyState={
        <EmptyState
          compact
          title="Bu dönemde izin kaydı yok"
          description="Başka bir dönem seçin veya filtreleri gevşetin."
        />
      }
    />
  );
}
