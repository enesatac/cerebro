import { Badge, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDate, toIsoDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import type { Vendor } from '../types';
import type { ContractEvent } from '../utils/contractSchedule';
import { ContractTitleCell } from './ContractTitleCell';

const KIND_VARIANT = { end: 'info', notice: 'warning', payment: 'neutral' } as const;

/** Ends, notice deadlines and instalments coming up, earliest (and overdue) first. */
export function UpcomingEventsTable({
  events,
  vendors,
}: {
  events: readonly ContractEvent[];
  vendors: ReadonlyMap<number, Vendor>;
}) {
  const today = toIsoDate(new Date());
  const columns = useMemo<TableColumnDef<ContractEvent>[]>(
    () => [
      {
        id: 'date',
        header: 'Tarih',
        width: 130,
        cell: ({ row }) => (
          <span className={row.original.date < today ? 'c-text-warning' : undefined}>
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        id: 'kind',
        header: 'Ne',
        width: 190,
        cell: ({ row }) => (
          <Badge
            variant={row.original.date < today ? 'danger' : KIND_VARIANT[row.original.kind]}
            appearance="filledLight"
            size="small"
          >
            {row.original.label}
          </Badge>
        ),
      },
      {
        id: 'contract',
        header: 'Sözleşme',
        cell: ({ row }) => <ContractTitleCell contract={row.original.contract} />,
      },
      {
        id: 'vendor',
        header: 'Tedarikçi',
        width: 200,
        cell: ({ row }) => vendors.get(row.original.contract.vendorId)?.name ?? '—',
      },
      {
        id: 'amount',
        header: 'Tutar',
        width: 140,
        align: 'end',
        cell: ({ row }) =>
          row.original.payment
            ? formatCurrency(row.original.payment.amount, row.original.contract.currency)
            : '—',
      },
    ],
    [today, vendors],
  );
  return (
    <Table
      data={[...events]}
      columns={columns}
      getRowId={(row) => `${row.kind}-${row.contract.id}-${row.payment?.id ?? row.date}`}
      emptyState={<EmptyState compact title="Önümüzdeki dönemde tarih yok" />}
    />
  );
}
