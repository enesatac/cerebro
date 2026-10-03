import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePrivilege } from '@/domains/auth/api/queries';
import type { Vendor } from '../types';
import { VendorDeleteAction } from './VendorDeleteAction';

interface VendorTableProps {
  vendors: readonly Vendor[];
  contractCount: (vendorId: number) => number;
  onEdit: (vendor: Vendor) => void;
}

export function VendorTable({ vendors, contractCount, onEdit }: VendorTableProps) {
  const canEdit = usePrivilege('contracts:edit');
  // Stable renderers keep the row delete confirmation open across refreshes.
  const columns = useMemo<TableColumnDef<Vendor>[]>(
    () => [
      {
        id: 'name',
        header: 'Firma',
        width: 260,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <strong>{row.original.name}</strong>
            {row.original.taxNumber && (
              <span className="c-muted c-cell-stack__secondary">VKN {row.original.taxNumber}</span>
            )}
          </span>
        ),
      },
      {
        id: 'contact',
        header: 'İletişim',
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{row.original.contactName || '—'}</span>
            {row.original.contactEmail && (
              <a
                className="c-link c-cell-stack__secondary"
                href={`mailto:${row.original.contactEmail}`}
              >
                {row.original.contactEmail}
              </a>
            )}
          </span>
        ),
      },
      {
        id: 'phone',
        header: 'Telefon',
        width: 170,
        cell: ({ row }) => row.original.contactPhone || '—',
      },
      {
        id: 'contracts',
        header: 'Sözleşme',
        width: 100,
        align: 'end',
        cell: ({ row }) => contractCount(row.original.id),
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: <span className="c-visually-hidden">İşlemler</span>,
              align: 'end',
              width: 120,
              cell: ({ row }) => (
                <span className="c-row-actions">
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="text"
                    aria-label={`Düzenle: ${row.original.name}`}
                    onClick={() => onEdit(row.original)}
                  >
                    Düzenle
                  </Button>
                  <VendorDeleteAction record={row.original} />
                </span>
              ),
            } satisfies TableColumnDef<Vendor>,
          ]
        : []),
    ],
    // `onEdit` only opens page state; `contractCount` reads the same contracts list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, vendors],
  );
  return (
    <Table
      data={[...vendors]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={<EmptyState compact title="Henüz tedarikçi yok" />}
    />
  );
}
