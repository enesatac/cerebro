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
}

export function DocumentationTable({
  links,
  emptyTitle,
  emptyDescription,
}: DocumentationTableProps) {
  return (
    <Table
      data={links}
      columns={columns}
      getRowId={(row) => row.id}
      emptyState={<EmptyState compact title={emptyTitle} description={emptyDescription} />}
    />
  );
}
