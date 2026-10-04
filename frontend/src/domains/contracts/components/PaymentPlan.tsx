import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo } from 'react';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { formatDate, toIsoDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import type { Contract, ContractPayment } from '../types';
import { paymentSummary } from '../utils/contractSchedule';

/** Contract value by stage (paid, invoiced, planned, unplanned) and every instalment. */
export function PaymentPlan({ contract }: { contract: Contract }) {
  const today = toIsoDate(new Date());
  const summary = paymentSummary(contract);
  const money = (value: number | null) => formatCurrency(value, contract.currency);
  const columns = useMemo<TableColumnDef<ContractPayment>[]>(
    () => [
      {
        id: 'due',
        header: 'Vade',
        width: 130,
        cell: ({ row }) => {
          const late =
            row.original.dueDate < today &&
            (row.original.status === 'planned' || row.original.status === 'invoiced');
          return (
            <span className="c-cell-stack">
              <span>{formatDate(row.original.dueDate)}</span>
              {late && <span className="c-text-warning c-cell-stack__secondary">Gecikmiş</span>}
            </span>
          );
        },
      },
      { id: 'description', header: 'Açıklama', cell: ({ row }) => row.original.description || '—' },
      {
        id: 'amount',
        header: 'Tutar',
        width: 140,
        align: 'end',
        cell: ({ row }) => formatCurrency(row.original.amount, contract.currency),
      },
      {
        id: 'status',
        header: 'Durum',
        width: 130,
        cell: ({ row }) => <MasterBadge list="paymentStatuses" code={row.original.status} />,
      },
      {
        id: 'invoice',
        header: 'Fatura no',
        width: 150,
        cell: ({ row }) => row.original.invoiceNumber || '—',
      },
      {
        id: 'paid',
        header: 'Ödeme tarihi',
        width: 130,
        cell: ({ row }) => formatDate(row.original.paidDate),
      },
    ],
    [contract.currency, today],
  );
  return (
    <div className="c-stack c-stack--s">
      <div className="c-stat-grid" role="group" aria-label="Ödeme özeti">
        <StatTile label="Sözleşme bedeli" value={money(summary.value)} />
        <StatTile label="Ödenen" value={money(summary.paid)} />
        <StatTile
          label="Faturalanan, ödenmedi"
          value={money(summary.invoiced)}
          tone={summary.invoiced > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Kalan"
          value={money(summary.remaining)}
          detail={
            summary.unplanned
              ? `${money(summary.unplanned)} henüz ödeme planında değil`
              : 'tamamı planlandı'
          }
        />
      </div>
      <Table
        data={contract.payments}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={
          <EmptyState
            compact
            title="Ödeme planı yok"
            description="Taksitleri sözleşmeyi düzenleyerek ekleyin."
          />
        }
      />
    </div>
  );
}
