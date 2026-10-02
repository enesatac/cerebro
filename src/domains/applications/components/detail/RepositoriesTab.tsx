import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
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
  const masterData = useMasterData();
  return (
    <SectionCard
      title="Kaynak kod depoları"
      description="Kodun, altyapının ve yapılandırmanın bulunduğu yerler."
      actions={
        <ExcelExportButton
          title={`${application.name} — kod depoları`}
          disabled={application.repositories.length === 0}
          build={() => [
            sheet<SourceRepository>({
              name: 'Kod depoları',
              title: `${application.name} kod depoları`,
              rows: application.repositories,
              columns: [
                { header: 'Kod deposu', value: (r) => r.name },
                { header: 'Tür', value: (r) => masterData.label('sourceRepositoryTypes', r.type) },
                { header: 'Adres', value: (r) => r.url, type: 'link' },
                { header: 'Varsayılan dal', value: (r) => r.defaultBranch },
                { header: 'Açıklama', value: (r) => r.description, width: 50 },
              ],
            }),
          ]}
        />
      }
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
