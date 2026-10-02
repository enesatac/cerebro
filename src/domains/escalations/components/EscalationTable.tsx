import { useMemo } from 'react';
import { AttachmentsButton } from '@/domains/attachments/components/AttachmentsButton';
import { loadPortfolioNames } from '@/domains/shared/utils/portfolioNames';
import { useRepositories } from '@/services/RepositoryContext';
import { TableExportBar } from '@/components/actions/TableExportBar';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { usePeopleById } from '@/domains/people/api/queries';
import { RelatedEntityLinks } from '@/domains/risks/components/RelatedEntityLinks';
import { useTeamsById } from '@/domains/teams/api/queries';
import { formatDate } from '@/lib/dates';
import type { Escalation } from '../types';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { EscalationDeleteAction } from './EscalationDeleteAction';

interface EscalationTableProps {
  escalations: Escalation[];
  showRelated?: boolean;
  emptyState: ReactNode;
  pagination?: boolean;
  /** Workbook title for the Excel export, e.g. "Ödeme Geçidi — eskalasyonlar". */
  exportTitle?: string;
}

export function EscalationTable({
  escalations,
  showRelated = false,
  emptyState,
  pagination,
  exportTitle = 'Eskalasyonlar',
}: EscalationTableProps) {
  const people = usePeopleById();
  const masterData = useMasterData();
  const repositories = useRepositories();
  const teams = useTeamsById();
  const canEdit = usePermission('portfolio:edit');
  // Stable column definitions: Takeoff's table remounts cells when their renderers change, which
  // would reset row-level state (an open attachments or delete dialog) on every re-render.
  const columns = useMemo<TableColumnDef<Escalation>[]>(
    () => [
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
        cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.severity} />,
      },
      {
        id: 'status',
        header: 'Durum',
        cell: ({ row }) => <MasterBadge list="escalationStatuses" code={row.original.status} />,
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
      {
        id: 'attachments',
        header: 'Ekler',
        width: 80,
        align: 'end',
        cell: ({ row }) => (
          <AttachmentsButton
            owner={{ type: 'escalation', id: row.original.id }}
            ownerName={row.original.title}
          />
        ),
      },
      ...(canEdit
        ? [
            editColumn<Escalation>(
              (escalation) => paths.escalationForms.edit(escalation.id),
              (escalation) => escalation.title,
              (escalation) => <EscalationDeleteAction record={escalation} compact />,
            ),
          ]
        : []),
    ],
    [people.data, teams.data, canEdit, showRelated],
  );

  const exportSheets = async () => {
    const names = await loadPortfolioNames(repositories);
    return [
      sheet<Escalation>({
        name: 'Eskalasyonlar',
        title: exportTitle,
        rows: escalations,
        columns: [
          { header: 'Eskalasyon', value: (e) => e.title },
          { header: 'Açıklama', value: (e) => e.description, width: 50 },
          { header: 'Önem derecesi', value: (e) => masterData.label('criticalities', e.severity) },
          { header: 'Durum', value: (e) => masterData.label('escalationStatuses', e.status) },
          {
            header: 'Sahip',
            value: (e) => (e.ownerId ? people.data?.get(e.ownerId)?.fullName : 'Atanmamış'),
          },
          {
            header: 'Sorumlu ekip',
            value: (e) => (e.responsibleTeamId ? teams.data?.get(e.responsibleTeamId)?.name : null),
          },
          { header: 'Açan', value: (e) => people.data?.get(e.raisedById)?.fullName },
          { header: 'Açılış', value: (e) => e.raisedAt, type: 'date' },
          { header: 'Hedef çözüm', value: (e) => e.targetResolutionDate, type: 'date' },
          { header: 'Çözüm tarihi', value: (e) => e.resolvedOn, type: 'date' },
          { header: 'Çözüm', value: (e) => e.resolution, width: 50 },
          {
            header: 'Etkilenen uygulamalar',
            value: (e) => names.applications(e.relatedApplicationIds),
          },
          {
            header: 'Etkilenen projeler',
            value: (e) => names.projects(e.relatedProjectIds),
          },
        ],
      }),
    ];
  };

  return (
    <>
      <TableExportBar
        title={exportTitle}
        build={exportSheets}
        disabled={escalations.length === 0}
      />
      <Table
        data={escalations}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={emptyState}
        pagination={pagination ? { pageSize: 25, pageSizeOptions: [25, 50, 100] } : undefined}
      />
    </>
  );
}
