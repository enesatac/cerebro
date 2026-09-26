import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import type { Application, SourceRepository } from '../../types';
import { SOURCE_REPOSITORY_TYPE_LABELS } from '../../utils/applicationPresentation';

const columns: TableColumnDef<SourceRepository>[] = [
  {
    id: 'name',
    header: 'Repository',
    cell: ({ row }) => <ExternalLink href={row.original.url}>{row.original.name}</ExternalLink>,
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => SOURCE_REPOSITORY_TYPE_LABELS[row.original.type],
  },
  {
    id: 'branch',
    header: 'Default branch',
    cell: ({ row }) => <code>{row.original.defaultBranch}</code>,
  },
  { id: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '' },
];

export function RepositoriesTab({ application }: { application: Application }) {
  return (
    <SectionCard
      title="Source repositories"
      description="Where the code, infrastructure and configuration live."
    >
      <Table
        data={application.repositories}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            compact
            title="No repositories have been added to this application yet"
            description={
              application.hosting.model === 'saas'
                ? 'Vendor-hosted products often have no source code; link configuration or integration repositories if they exist.'
                : 'Link the frontend, backend and infrastructure repositories so engineers can find the code.'
            }
          />
        }
      />
    </SectionCard>
  );
}
