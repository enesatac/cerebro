import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDate } from '@/lib/dates';
import type { Risk } from '../types';
import { RelatedEntityLinks } from './RelatedEntityLinks';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { RiskDeleteAction } from './RiskDeleteAction';

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
      cell: ({ row }) => <MasterLabel list="riskCategories" code={row.original.category} />,
    },
    {
      id: 'severity',
      header: 'Önem derecesi',
      cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.severity} />,
    },
    {
      id: 'status',
      header: 'Durum',
      cell: ({ row }) => <MasterBadge list="riskStatuses" code={row.original.status} />,
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
            (risk) => <RiskDeleteAction record={risk} compact />,
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
