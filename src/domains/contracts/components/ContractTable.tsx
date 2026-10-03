import { Badge, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo, type ReactNode } from 'react';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { PercentMeter } from '@/components/data-display/PercentMeter';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { toIsoDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import type { Contract, Vendor } from '../types';
import { contractAlerts, paymentSummary } from '../utils/contractSchedule';
import { ContractTerm } from './ContractTerm';
import { ContractTitleCell } from './ContractTitleCell';

interface ContractTableProps {
  contracts: readonly Contract[];
  vendors: ReadonlyMap<number, Vendor>;
  /** Hidden on a project's own tab. */
  showProject?: boolean;
  emptyState: ReactNode;
}

/** Contracts with their term, value, how much is paid and anything that needs attention. */
export function ContractTable({
  contracts,
  vendors,
  showProject = true,
  emptyState,
}: ContractTableProps) {
  const projects = useProjectRefs();
  const today = toIsoDate(new Date());
  const columns = useMemo<TableColumnDef<Contract>[]>(
    () => [
      {
        id: 'title',
        header: 'Sözleşme',
        width: 300,
        cell: ({ row }) => <ContractTitleCell contract={row.original} />,
      },
      ...(showProject
        ? [
            {
              id: 'project',
              header: 'Proje',
              width: 200,
              cell: ({ row }) => (
                <EntityLink to={paths.projects.detail(row.original.projectId)}>
                  {projects.data?.get(row.original.projectId)?.name ?? '—'}
                </EntityLink>
              ),
            } satisfies TableColumnDef<Contract>,
          ]
        : []),
      {
        id: 'vendor',
        header: 'Tedarikçi',
        width: 190,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{vendors.get(row.original.vendorId)?.name ?? '—'}</span>
            <span className="c-muted c-cell-stack__secondary">
              <MasterLabel list="contractTypes" code={row.original.type} />
            </span>
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Durum',
        width: 160,
        cell: ({ row }) => (
          <MasterBadge list="contractStatuses" code={row.original.status} context="Durum:" />
        ),
      },
      {
        id: 'term',
        header: 'Dönem',
        width: 210,
        cell: ({ row }) => <ContractTerm contract={row.original} />,
      },
      {
        id: 'value',
        header: 'Bedel',
        width: 130,
        align: 'end',
        cell: ({ row }) => formatCurrency(row.original.totalValue, row.original.currency),
      },
      {
        id: 'paid',
        header: 'Ödenen',
        width: 150,
        cell: ({ row }) => {
          const summary = paymentSummary(row.original);
          return summary.value ? (
            <PercentMeter
              value={Math.round((summary.paid / summary.value) * 100)}
              label={`${row.original.code} ödenen`}
            />
          ) : (
            <span className="c-muted">—</span>
          );
        },
      },
      {
        id: 'alerts',
        header: 'Dikkat',
        width: 200,
        cell: ({ row }) => {
          const alerts = contractAlerts(row.original, today);
          return alerts.length === 0 ? (
            <span className="c-muted">—</span>
          ) : (
            <ul className="c-inline-list" aria-label="Uyarılar">
              {alerts.map((alert) => (
                <li key={alert.kind}>
                  <Badge variant={alert.tone} appearance="filledLight" size="small">
                    {ALERT_LABELS[alert.kind]}
                  </Badge>
                </li>
              ))}
            </ul>
          );
        },
      },
    ],
    [showProject, projects.data, vendors, today],
  );
  return (
    <Table
      data={[...contracts]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={emptyState}
    />
  );
}

const ALERT_LABELS = {
  'expired-active': 'Süresi geçti',
  ending: 'Bitiyor',
  notice: 'İhbar yaklaşıyor',
  'overdue-payment': 'Gecikmiş ödeme',
} as const;
