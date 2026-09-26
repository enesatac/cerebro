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
    header: 'Ortam',
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
    header: 'Durum',
    cell: ({ row }) => <StatusBadge {...ENVIRONMENT_STATUS_PRESENTATION[row.original.status]} />,
  },
  {
    id: 'url',
    header: 'URL',
    cell: ({ row }) =>
      row.original.url ? (
        <ExternalLink href={row.original.url}>{row.original.url}</ExternalLink>
      ) : (
        <span className="c-muted">Yok</span>
      ),
  },
  {
    id: 'region',
    header: 'Bölge',
    cell: ({ row }) => row.original.region ?? <span className="c-muted">—</span>,
  },
  { id: 'notes', header: 'Notlar', cell: ({ row }) => row.original.notes ?? '' },
];

export function EnvironmentsTab({ application }: { application: Application }) {
  // Promotion order (dev → prod → DR) reads naturally.
  const environments = [...application.environments].sort(
    (a, b) => ENVIRONMENT_TYPES.indexOf(a.type) - ENVIRONMENT_TYPES.indexOf(b.type),
  );
  return (
    <SectionCard
      title="Ortamlar"
      description="Uygulamanın nereye kurulduğu. Cerebro asla kimlik bilgisi saklamaz — ekibin secrets manager'ını kullanın."
    >
      <Table
        data={environments}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            compact
            title="Bu uygulamaya henüz ortam eklenmedi"
            description={
              application.lifecycle === 'planned'
                ? 'Ortamlar genellikle geliştirme başladığında kaydedilir.'
                : 'Destek ekiplerinin nerede çalıştığını bilmesi için en azından canlı ortamı kaydedin.'
            }
          />
        }
      />
    </SectionCard>
  );
}
