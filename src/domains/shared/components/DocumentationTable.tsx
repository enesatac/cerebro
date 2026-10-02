import { TableExportBar } from '@/components/actions/TableExportBar';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
import { Badge, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { DocumentationLink } from '../types';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';

const columns: TableColumnDef<DocumentationLink>[] = [
  {
    id: 'title',
    header: 'Doküman',
    cell: ({ row }) => <ExternalLink href={row.original.url}>{row.original.title}</ExternalLink>,
  },
  {
    id: 'type',
    header: 'Tür',
    cell: ({ row }) => (
      <Badge variant="neutral" appearance="outlined" size="small">
        <MasterLabel list="documentationLinkTypes" code={row.original.type} />
      </Badge>
    ),
  },
  { id: 'description', header: 'Açıklama', cell: ({ row }) => row.original.description ?? '' },
];

interface DocumentationTableProps {
  links: DocumentationLink[];
  emptyTitle: string;
  emptyDescription?: string;
  /** Workbook title for the Excel export, e.g. "Ödeme Geçidi — dokümantasyon". */
  exportTitle: string;
}

export function DocumentationTable({
  links,
  emptyTitle,
  emptyDescription,
  exportTitle,
}: DocumentationTableProps) {
  const masterData = useMasterData();
  return (
    <>
      <TableExportBar
        title={exportTitle}
        disabled={links.length === 0}
        build={() => [
          sheet<DocumentationLink>({
            name: 'Dokümantasyon',
            title: exportTitle,
            rows: links,
            columns: [
              { header: 'Doküman', value: (l) => l.title },
              { header: 'Tür', value: (l) => masterData.label('documentationLinkTypes', l.type) },
              { header: 'Adres', value: (l) => l.url, type: 'link' },
              { header: 'Açıklama', value: (l) => l.description, width: 50 },
            ],
          }),
        ]}
      />
      <Table
        data={links}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={<EmptyState compact title={emptyTitle} description={emptyDescription} />}
      />
    </>
  );
}
