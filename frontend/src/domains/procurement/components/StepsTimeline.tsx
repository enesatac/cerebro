import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo, type ReactNode } from 'react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import type { IsoDate } from '@/domains/shared/types';
import { formatDate } from '@/lib/dates';
import type { ProcurementStep } from '../types';
import { currentStep, delayDays } from '../utils/processState';

const range = (start: IsoDate | null, end: IsoDate | null) =>
  start || end ? `${start ? formatDate(start) : '…'} – ${end ? formatDate(end) : '…'}` : '—';

function Delay({ step, today }: { step: ProcurementStep; today: IsoDate }) {
  const days = delayDays(step, today);
  if (days === null) return <span className="c-muted">—</span>;
  if (days > 0) return <StatusBadge label={`${days} gün geç`} variant="warning" />;
  if (days < 0) return <StatusBadge label={`${-days} gün erken`} variant="success" />;
  return <span className="c-muted">Zamanında</span>;
}

/** The steps in order, planned against actual dates, with the current step marked. */
export function StepsTimeline({
  steps,
  today,
  emptyState,
}: {
  steps: readonly ProcurementStep[];
  today: IsoDate;
  emptyState: ReactNode;
}) {
  const people = usePeopleById();
  const current = currentStep(steps);
  const columns = useMemo<TableColumnDef<ProcurementStep>[]>(
    () => [
      {
        id: 'order',
        header: '#',
        width: 56,
        cell: ({ row }) => row.index + 1,
      },
      {
        id: 'type',
        header: 'Adım',
        width: 220,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <strong>
              <MasterLabel list="procurementSteps" code={row.original.type} />
            </strong>
            {row.original.id === current?.id && (
              <span className="c-muted c-cell-stack__secondary">Güncel adım</span>
            )}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Durum',
        width: 150,
        cell: ({ row }) => (
          <MasterBadge list="procurementStepStatuses" code={row.original.status} context="Durum:" />
        ),
      },
      {
        id: 'owner',
        header: 'Sorumlu',
        width: 170,
        cell: ({ row }) =>
          row.original.ownerId !== null ? (
            (people.data?.get(row.original.ownerId)?.fullName ?? '—')
          ) : (
            <span className="c-muted">Atanmamış</span>
          ),
      },
      {
        id: 'planned',
        header: 'Planlanan',
        width: 210,
        cell: ({ row }) => range(row.original.plannedStart, row.original.plannedEnd),
      },
      {
        id: 'actual',
        header: 'Gerçekleşen',
        width: 210,
        cell: ({ row }) => range(row.original.actualStart, row.original.actualEnd),
      },
      {
        id: 'delay',
        header: 'Sapma',
        width: 130,
        cell: ({ row }) => <Delay step={row.original} today={today} />,
      },
      {
        id: 'note',
        header: 'Açıklama',
        width: 260,
        cell: ({ row }) =>
          row.original.note ? row.original.note : <span className="c-muted">—</span>,
      },
    ],
    [people.data, current?.id, today],
  );
  return (
    <Table
      data={[...steps]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={emptyState}
    />
  );
}
