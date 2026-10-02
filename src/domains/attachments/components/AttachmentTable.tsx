import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ArrowDownloadIconOutlinedRounded } from '@takeoff-icons/react/arrow-download';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { useMemo, useState } from 'react';
import { TableExportBar } from '@/components/actions/TableExportBar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePermission } from '@/domains/auth/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDate } from '@/lib/dates';
import { sheet } from '@/lib/xlsxTypes';
import type { Attachment } from '../types';
import { formatFileSize, isPreviewable } from '../utils/attachmentFiles';
import { AttachmentDeleteAction } from './AttachmentDeleteAction';
import { AttachmentEditDialog } from './AttachmentEditDialog';
import { useAttachmentFile } from './useAttachmentFile';

interface AttachmentTableProps {
  attachments: readonly Attachment[];
  /** Workbook title for the Excel export, e.g. "Ödeme Geçidi — ekler". */
  exportTitle: string;
}

/** Files of a record: open or download, and (for editors) retype, describe or delete them. */
export function AttachmentTable({ attachments, exportTitle }: AttachmentTableProps) {
  const masterData = useMasterData();
  const people = usePeopleById();
  const canEdit = usePermission('portfolio:edit');
  const file = useAttachmentFile();
  const [editing, setEditing] = useState<Attachment | null>(null);
  const uploader = (a: Attachment) =>
    a.uploadedBy ? people.data?.get(a.uploadedBy)?.fullName : null;

  // Stable renderers keep row dialogs (delete confirmation) open across data refreshes.
  const columns = useMemo<TableColumnDef<Attachment>[]>(
    () => [
      {
        id: 'file',
        header: 'Dosya',
        width: 320,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <button
              type="button"
              className="c-link c-link-button"
              onClick={() => file.open(row.original)}
              aria-label={`${isPreviewable(row.original.contentType) ? 'Aç' : 'İndir'}: ${row.original.fileName}`}
            >
              {row.original.fileName}
            </button>
            {row.original.description && (
              <span className="c-muted c-cell-stack__secondary">{row.original.description}</span>
            )}
          </span>
        ),
      },
      {
        id: 'type',
        header: 'Tür',
        width: 170,
        cell: ({ row }) => masterData.label('documentTypes', row.original.documentType),
      },
      {
        id: 'size',
        header: 'Boyut',
        width: 90,
        align: 'end',
        cell: ({ row }) => formatFileSize(row.original.sizeBytes),
      },
      {
        id: 'uploaded',
        header: 'Yükleyen',
        width: 170,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{uploader(row.original) ?? '—'}</span>
            <span className="c-muted c-cell-stack__secondary">
              {formatDate(row.original.uploadedAt)}
            </span>
          </span>
        ),
      },
      {
        id: 'actions',
        header: <span className="c-visually-hidden">İşlemler</span>,
        align: 'end',
        width: canEdit ? 130 : 60,
        cell: ({ row }) => (
          <span className="c-row-actions">
            <Button
              size="small"
              variant="neutral"
              appearance="text"
              startContent={<ArrowDownloadIconOutlinedRounded aria-hidden="true" />}
              aria-label={`Dosyayı indir: ${row.original.fileName}`}
              loading={file.pendingId === row.original.id}
              onClick={() => file.download(row.original)}
            />
            {canEdit && (
              <Button
                size="small"
                variant="neutral"
                appearance="text"
                startContent={<EditIconOutlinedRounded aria-hidden="true" />}
                aria-label={`Düzenle: ${row.original.fileName}`}
                onClick={() => setEditing(row.original)}
              />
            )}
            <AttachmentDeleteAction record={row.original} />
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `file` and `uploader` read state captured below
    [masterData, people.data, canEdit, file.pendingId],
  );

  return (
    <>
      <TableExportBar
        title={exportTitle}
        disabled={attachments.length === 0}
        build={() => [
          sheet<Attachment>({
            name: 'Ekler',
            title: exportTitle,
            rows: attachments,
            columns: [
              { header: 'Dosya', value: (a) => a.fileName },
              { header: 'Tür', value: (a) => masterData.label('documentTypes', a.documentType) },
              { header: 'Açıklama', value: (a) => a.description, width: 50 },
              {
                header: 'Boyut (KB)',
                value: (a) => Math.round(a.sizeBytes / 102.4) / 10,
                type: 'decimal',
              },
              { header: 'Yükleyen', value: uploader },
              { header: 'Yükleme tarihi', value: (a) => a.uploadedAt, type: 'date' },
            ],
          }),
        ]}
      />
      <Table
        data={[...attachments]}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={<EmptyState compact title="Henüz dosya eklenmedi" />}
      />
      {editing && (
        <AttachmentEditDialog
          key={editing.id}
          attachment={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
