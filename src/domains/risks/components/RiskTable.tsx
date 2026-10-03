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
import { formatDate } from '@/lib/dates';
import type { Risk } from '../types';
import { RelatedEntityLinks } from './RelatedEntityLinks';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePrivilege } from '@/domains/auth/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { RiskDeleteAction } from './RiskDeleteAction';

interface RiskTableProps {
  risks: Risk[];
  /** Show the related applications/projects column (portfolio views). */
  showRelated?: boolean;
  emptyState: ReactNode;
  pagination?: boolean;
  /** Workbook title for the Excel export, e.g. "Ödeme Geçidi — riskler". */
  exportTitle?: string;
}

export function RiskTable({
  risks,
  showRelated = false,
  emptyState,
  pagination,
  exportTitle = 'Riskler',
}: RiskTableProps) {
  const people = usePeopleById();
  const masterData = useMasterData();
  const repositories = useRepositories();
  const canEdit = usePrivilege('risks:edit');
  // Stable column definitions: Takeoff's table remounts cells when their renderers change, which
  // would reset row-level state (an open attachments or delete dialog) on every re-render.
  const columns = useMemo<TableColumnDef<Risk>[]>(
    () => [
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
      {
        id: 'attachments',
        header: 'Ekler',
        width: 80,
        align: 'end',
        cell: ({ row }) => (
          <AttachmentsButton
            owner={{ type: 'risk', id: row.original.id }}
            ownerName={row.original.title}
          />
        ),
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
    ],
    [people.data, canEdit, showRelated],
  );

  const exportSheets = async () => {
    const names = await loadPortfolioNames(repositories);
    return [
      sheet<Risk>({
        name: 'Riskler',
        title: exportTitle,
        rows: risks,
        columns: [
          { header: 'Risk', value: (r) => r.title },
          { header: 'Açıklama', value: (r) => r.description, width: 50 },
          { header: 'Kategori', value: (r) => masterData.label('riskCategories', r.category) },
          { header: 'Olasılık', value: (r) => masterData.label('criticalities', r.probability) },
          { header: 'Etki', value: (r) => masterData.label('criticalities', r.impact) },
          { header: 'Önem derecesi', value: (r) => masterData.label('criticalities', r.severity) },
          { header: 'Durum', value: (r) => masterData.label('riskStatuses', r.status) },
          {
            header: 'Sahip',
            value: (r) => (r.ownerId ? people.data?.get(r.ownerId)?.fullName : 'Atanmamış'),
          },
          { header: 'Azaltma planı', value: (r) => r.mitigationPlan, width: 50 },
          { header: 'Termin', value: (r) => r.dueDate, type: 'date' },
          {
            header: 'Etkilenen uygulamalar',
            value: (r) => names.applications(r.relatedApplicationIds),
          },
          {
            header: 'Etkilenen projeler',
            value: (r) => names.projects(r.relatedProjectIds),
          },
          { header: 'Kayıt tarihi', value: (r) => r.audit.createdAt, type: 'date' },
        ],
      }),
    ];
  };

  return (
    <>
      <TableExportBar title={exportTitle} build={exportSheets} disabled={risks.length === 0} />
      <Table
        data={risks}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={emptyState}
        pagination={pagination ? { pageSize: 25, pageSizeOptions: [25, 50, 100] } : undefined}
      />
    </>
  );
}
