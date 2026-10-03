import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo } from 'react';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDate } from '@/lib/dates';
import type { ReactNode } from 'react';
import type { Demand } from '../types';
import { DemandPlan } from './DemandPlan';
import { DemandTitleCell } from './DemandTitleCell';

interface DemandTableProps {
  demands: readonly Demand[];
  emptyState: ReactNode;
}

/** The requester's view of demands: what was asked, by whom, and where it stands. */
export function DemandTable({ demands, emptyState }: DemandTableProps) {
  const people = usePeopleById();
  const units = useBusinessUnitsById();
  const columns = useMemo<TableColumnDef<Demand>[]>(
    () => [
      {
        id: 'title',
        header: 'Talep',
        width: 320,
        cell: ({ row }) => <DemandTitleCell demand={row.original} />,
      },
      {
        id: 'type',
        header: 'Tür',
        width: 160,
        cell: ({ row }) => <MasterLabel list="demandTypes" code={row.original.type} />,
      },
      {
        id: 'requester',
        header: 'Talep eden',
        width: 200,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{people.data?.get(row.original.requesterId)?.fullName ?? '—'}</span>
            <span className="c-muted c-cell-stack__secondary">
              {units.data?.get(row.original.businessUnitId)?.name}
            </span>
          </span>
        ),
      },
      {
        id: 'submitted',
        header: 'Gönderim',
        width: 120,
        cell: ({ row }) => formatDate(row.original.submittedAt),
      },
      {
        id: 'status',
        header: 'Durum',
        width: 160,
        cell: ({ row }) => (
          <MasterBadge list="demandStatuses" code={row.original.status} context="Durum:" />
        ),
      },
      {
        id: 'plan',
        header: 'Plan',
        width: 170,
        cell: ({ row }) => <DemandPlan demand={row.original} />,
      },
    ],
    [people.data, units.data],
  );
  return (
    <Table
      data={[...demands]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={emptyState}
    />
  );
}
