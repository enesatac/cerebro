import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { usePeopleById } from '@/domains/people/api/queries';
import { RelatedEntityLinks } from '@/domains/risks/components/RelatedEntityLinks';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTeamsById } from '@/domains/teams/api/queries';
import { formatDate } from '@/lib/dates';
import type { Escalation } from '../types';
import { ESCALATION_STATUS_PRESENTATION } from '../utils/escalationPresentation';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';

interface EscalationTableProps {
  escalations: Escalation[];
  showRelated?: boolean;
  emptyState: ReactNode;
  pagination?: boolean;
}

export function EscalationTable({
  escalations,
  showRelated = false,
  emptyState,
  pagination,
}: EscalationTableProps) {
  const people = usePeopleById();
  const teams = useTeamsById();
  const canEdit = usePermission('portfolio:edit');
  const columns: TableColumnDef<Escalation>[] = [
    {
      id: 'title',
      header: 'Eskalasyon',
      width: 320,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>{row.original.title}</span>
          <span className="c-muted c-cell-stack__secondary">
            {row.original.resolution ?? row.original.description}
          </span>
        </span>
      ),
    },
    {
      id: 'severity',
      header: 'Önem derecesi',
      cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.severity]} />,
    },
    {
      id: 'status',
      header: 'Durum',
      cell: ({ row }) => <StatusBadge {...ESCALATION_STATUS_PRESENTATION[row.original.status]} />,
    },
    {
      id: 'owner',
      header: 'Sahip / ekip',
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>
            {(row.original.ownerId && people.data?.get(row.original.ownerId)?.fullName) || (
              <span className="c-text-warning">Atanmamış</span>
            )}
          </span>
          <span className="c-muted c-cell-stack__secondary">
            {row.original.responsibleTeamId
              ? teams.data?.get(row.original.responsibleTeamId)?.name
              : ''}
          </span>
        </span>
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
          } satisfies TableColumnDef<Escalation>,
        ]
      : []),
    { id: 'raised', header: 'Açılış', cell: ({ row }) => formatDate(row.original.raisedAt) },
    {
      id: 'target',
      header: 'Hedef çözüm',
      align: 'end',
      cell: ({ row }) => formatDate(row.original.targetResolutionDate),
    },
    ...(canEdit
      ? [
          editColumn<Escalation>(
            (escalation) => paths.escalationForms.edit(escalation.id),
            (escalation) => escalation.title,
          ),
        ]
      : []),
  ];

  return (
    <Table
      data={escalations}
      columns={columns}
      getRowId={(row) => row.id}
      emptyState={emptyState}
      pagination={pagination ? { pageSize: 25, pageSizeOptions: [25, 50, 100] } : undefined}
    />
  );
}
