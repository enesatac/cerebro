import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { usePeopleById } from '@/domains/people/api/queries';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { formatDate } from '@/lib/dates';
import type { Risk } from '../types';
import { RISK_CATEGORY_LABELS, RISK_STATUS_PRESENTATION } from '../utils/riskPresentation';
import { RelatedEntityLinks } from './RelatedEntityLinks';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';

interface RiskTableProps {
  risks: Risk[];
  /** Show the related applications/projects column (portfolio views). */
  showRelated?: boolean;
  emptyState: ReactNode;
  pagination?: boolean;
}

export function RiskTable({ risks, showRelated = false, emptyState, pagination }: RiskTableProps) {
  const people = usePeopleById();
  const canEdit = usePermission('portfolio:edit');
  const columns: TableColumnDef<Risk>[] = [
    {
      id: 'title',
      header: 'Risk',
      width: 320,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>{row.original.title}</span>
          <span className="c-muted c-cell-stack__secondary">{row.original.mitigationPlan}</span>
        </span>
      ),
    },
    {
      id: 'category',
      header: 'Kategori',
      cell: ({ row }) => RISK_CATEGORY_LABELS[row.original.category],
    },
    {
      id: 'severity',
      header: 'Önem derecesi',
      cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.severity]} />,
    },
    {
      id: 'status',
      header: 'Durum',
      cell: ({ row }) => <StatusBadge {...RISK_STATUS_PRESENTATION[row.original.status]} />,
    },
    {
      id: 'owner',
      header: 'Sahip',
      cell: ({ row }) =>
        (row.original.ownerId && people.data?.get(row.original.ownerId)?.fullName) || (
          <span className="c-text-warning">Atanmamış</span>
        ),
    },
    ...(showRelated
      ? [
          {
            id: 'related',
            header: 'Etkilenen',
            cell: ({ row }) => (
              <RelatedEntityLinks
                applicationIds={row.original.relatedApplicationIds}
                projectIds={row.original.relatedProjectIds}
              />
            ),
          } satisfies TableColumnDef<Risk>,
        ]
      : []),
    {
      id: 'due',
      header: 'Termin',
      align: 'end',
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    ...(canEdit
      ? [
          editColumn<Risk>(
            (risk) => paths.riskForms.edit(risk.id),
            (risk) => risk.title,
          ),
        ]
      : []),
  ];

  return (
    <Table
      data={risks}
      columns={columns}
      getRowId={(row) => row.id}
      emptyState={emptyState}
      pagination={pagination ? { pageSize: 25, pageSizeOptions: [25, 50, 100] } : undefined}
    />
  );
}
