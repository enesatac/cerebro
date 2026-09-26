import { Badge, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { DocumentationLink } from '../types';
import { DOCUMENTATION_LINK_TYPE_LABELS } from '../utils/presentation';

const columns: TableColumnDef<DocumentationLink>[] = [
  {
    id: 'title',
    header: 'Document',
    cell: ({ row }) => <ExternalLink href={row.original.url}>{row.original.title}</ExternalLink>,
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="neutral" appearance="outlined" size="small">
        {DOCUMENTATION_LINK_TYPE_LABELS[row.original.type]}
      </Badge>
    ),
  },
  { id: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '' },
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
