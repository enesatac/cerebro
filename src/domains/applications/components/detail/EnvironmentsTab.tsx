import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { ENVIRONMENT_TYPES, type Application, type Environment } from '../../types';
import {
  ENVIRONMENT_STATUS_PRESENTATION,
  ENVIRONMENT_TYPE_LABELS,
} from '../../utils/applicationPresentation';

const columns: TableColumnDef<Environment>[] = [
  {
    id: 'name',
    header: 'Environment',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <span>{row.original.name}</span>
        <span className="c-muted c-cell-stack__secondary">
          {ENVIRONMENT_TYPE_LABELS[row.original.type]}
        </span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge {...ENVIRONMENT_STATUS_PRESENTATION[row.original.status]} />,
  },
  {
    id: 'url',
    header: 'URL',
    cell: ({ row }) =>
      row.original.url ? (
        <ExternalLink href={row.original.url}>{row.original.url}</ExternalLink>
      ) : (
        <span className="c-muted">None</span>
      ),
  },
  {
    id: 'region',
    header: 'Region',
    cell: ({ row }) => row.original.region ?? <span className="c-muted">—</span>,
  },
  { id: 'notes', header: 'Notes', cell: ({ row }) => row.original.notes ?? '' },
];

export function EnvironmentsTab({ application }: { application: Application }) {
  // Promotion order (dev → prod → DR) reads naturally.
  const environments = [...application.environments].sort(
    (a, b) => ENVIRONMENT_TYPES.indexOf(a.type) - ENVIRONMENT_TYPES.indexOf(b.type),
  );
  return (
    <SectionCard
      title="Environments"
      description="Where the application is deployed. Cerebro never stores credentials — use the team's secrets manager."
    >
      <Table
        data={environments}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            compact
            title="No environments have been added to this application yet"
            description={
              application.lifecycle === 'planned'
                ? 'Environments are usually recorded once development starts.'
                : 'Record at least the production environment so support teams know where it runs.'
            }
          />
        }
      />
    </SectionCard>
  );
}
