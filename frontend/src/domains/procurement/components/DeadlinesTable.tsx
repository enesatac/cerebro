import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo } from 'react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import type { IsoDate } from '@/domains/shared/types';
import { formatDate } from '@/lib/dates';
import { delayDays, type StepDeadline } from '../utils/processState';
import { PurchaseTitleCell } from './PurchaseTitleCell';

/** Open steps due soon, overdue ones first: what the procurement team has to chase. */
export function DeadlinesTable({
  deadlines,
  today,
}: {
  deadlines: readonly StepDeadline[];
  today: IsoDate;
}) {
  const people = usePeopleById();
  const columns = useMemo<TableColumnDef<StepDeadline>[]>(
    () => [
      {
        id: 'due',
        header: 'Hedef tarih',
        width: 170,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span className={row.original.late ? 'c-text-warning' : undefined}>
              {formatDate(row.original.dueDate)}
            </span>
            {row.original.late && (
              <StatusBadge
                label={`${delayDays(row.original.step, today) ?? 0} gün gecikti`}
                variant="warning"
              />
            )}
          </span>
        ),
      },
      {
        id: 'step',
        header: 'Adım',
        width: 220,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <MasterLabel list="procurementSteps" code={row.original.step.type} />
            <span className="c-muted c-cell-stack__secondary">
              <MasterLabel list="procurementStepStatuses" code={row.original.step.status} />
            </span>
          </span>
        ),
      },
      {
        id: 'purchase',
        header: 'Satın alma',
        cell: ({ row }) => <PurchaseTitleCell purchase={row.original.purchase} />,
      },
      {
        id: 'owner',
        header: 'Adım sorumlusu',
        width: 200,
        cell: ({ row }) =>
          row.original.step.ownerId !== null
            ? (people.data?.get(row.original.step.ownerId)?.fullName ?? '—')
            : '—',
      },
    ],
    [people.data, today],
  );
  return (
    <Table
      data={[...deadlines]}
      columns={columns}
      getRowId={(row) => String(row.step.id)}
      emptyState={<EmptyState compact title="Yaklaşan veya geciken adım yok" />}
    />
  );
}
