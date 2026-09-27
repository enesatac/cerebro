import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import type { Application, SourceRepository } from '../../types';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';

const columns: TableColumnDef<SourceRepository>[] = [
  {
    id: 'name',
    header: 'Kod deposu',
    cell: ({ row }) => <ExternalLink href={row.original.url}>{row.original.name}</ExternalLink>,
  },
  {
    id: 'type',
    header: 'Tür',
    cell: ({ row }) => <MasterLabel list="sourceRepositoryTypes" code={row.original.type} />,
  },
  {
    id: 'branch',
    header: 'Varsayılan dal',
    cell: ({ row }) => <code>{row.original.defaultBranch}</code>,
  },
  { id: 'description', header: 'Açıklama', cell: ({ row }) => row.original.description ?? '' },
];

export function RepositoriesTab({ application }: { application: Application }) {
  return (
    <SectionCard
      title="Kaynak kod depoları"
      description="Kodun, altyapının ve yapılandırmanın bulunduğu yerler."
    >
      <Table
        data={application.repositories}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={
          <EmptyState
            compact
            title="Bu uygulamaya henüz kod deposu eklenmedi"
            description={
              application.hosting.model === 'saas'
                ? 'Tedarikçi tarafından barındırılan ürünlerin çoğu zaman kaynak kodu olmaz; varsa yapılandırma veya entegrasyon depolarını bağlayın.'
                : 'Mühendislerin kodu bulabilmesi için frontend, backend ve altyapı depolarını bağlayın.'
            }
          />
        }
      />
    </SectionCard>
  );
}
