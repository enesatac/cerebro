import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import type { Application, Environment } from '../../types';
import { useMasterData } from '@/domains/master-data/context';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';

const columns: TableColumnDef<Environment>[] = [
  {
    id: 'name',
    header: 'Ortam',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <span>{row.original.name}</span>
        <span className="c-muted c-cell-stack__secondary">
          <MasterLabel list="environmentTypes" code={row.original.type} />
        </span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Durum',
    cell: ({ row }) => <MasterBadge list="environmentStatuses" code={row.original.status} />,
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
  // Promotion order (dev → prod → DR, as ordered in master data) reads naturally.
  const order = useMasterData()
    .items('environmentTypes')
    .map((item) => item.code);
  const rank = (type: string) => (order.includes(type) ? order.indexOf(type) : order.length);
  const environments = [...application.environments].sort((a, b) => rank(a.type) - rank(b.type));
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
