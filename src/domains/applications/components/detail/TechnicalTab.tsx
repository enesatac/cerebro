import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { DetailList } from '@/components/data-display/DetailList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { useTechnologiesById } from '@/domains/technologies/api/queries';
import type { Technology } from '@/domains/technologies/types';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { useMasterData } from '@/domains/master-data/context';
import type { Application, DataStore } from '../../types';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';

/** Layers used by the application, in admin order; layers missing from the list come last. */
function layersInUse(order: string[], application: Application): string[] {
  const used = new Set(application.technologies.map((usage) => usage.layer));
  return [
    ...order.filter((layer) => used.has(layer)),
    ...[...used].filter((l) => !order.includes(l)),
  ];
}

export function TechnicalTab({ application }: { application: Application }) {
  const masterData = useMasterData();
  const technologies = useTechnologiesById();
  const catalogue = technologies.data ?? new Map<string, Technology>();

  return (
    <div className="c-stack">
      <SectionCard
        title="Teknoloji yığını"
        description="Katalogdaki teknolojiler, kullanıldıkları katmana göre gruplanmış."
      >
        {application.technologies.length === 0 ? (
          <EmptyState
            compact
            title="Bu uygulama için kayıtlı teknoloji yok"
            description={
              application.hosting.model === 'saas'
                ? 'Bu, tedarikçi tarafından barındırılan bir ürün; teknolojileri yalnızca ekipleriniz üzerine geliştirme yapıyorsa kaydedin.'
                : 'Üzerinde çalıştığı frontend, backend, veritabanı ve altyapı teknolojilerini ekleyin.'
            }
          />
        ) : (
          <DetailList
            items={layersInUse(
              masterData.items('technologyCategories').map((item) => item.code),
              application,
            ).map((layer) => ({
              label: masterData.label('technologyCategories', layer),
              value: (
                <ul className="c-inline-list">
                  {application.technologies
                    .filter((usage) => usage.layer === layer)
                    .map((usage) => {
                      const technology = catalogue.get(usage.technologyId);
                      return (
                        <li key={`${usage.technologyId}-${layer}`} className="c-tech-item">
                          <span>
                            <EntityLink to={paths.technologies.detail(usage.technologyId)}>
                              {technology?.name ?? usage.technologyId}
                            </EntityLink>
                            {usage.version && <span className="c-muted"> {usage.version}</span>}
                          </span>
                          {technology &&
                            technology.status !== 'preferred' &&
                            technology.status !== 'supported' && (
                              <MasterBadge
                                list="technologyStatuses"
                                code={technology.status}
                                context="Teknoloji durumu:"
                              />
                            )}
                        </li>
                      );
                    })}
                </ul>
              ),
            }))}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Veri depoları"
        description="Bu uygulamaya ait veritabanları ve önbellekler."
      >
        <Table
          data={application.dataStores}
          columns={dataStoreColumns(catalogue)}
          getRowId={(row) => row.id}
          emptyState={<EmptyState compact title="Bu uygulama için kayıtlı veri deposu yok" />}
        />
      </SectionCard>

      <SectionCard title="Barındırma">
        <DetailList
          items={[
            {
              label: 'Barındırma modeli',
              value: <MasterLabel list="hostingModels" code={application.hosting.model} />,
            },
            {
              label: 'Bulut sağlayıcı',
              value: application.hosting.cloudProvider,
              emptyText: 'Uygulanamaz',
            },
            { label: 'Notlar', value: application.hosting.notes },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function dataStoreColumns(catalogue: Map<string, Technology>): TableColumnDef<DataStore>[] {
  return [
    {
      id: 'name',
      header: 'Ad',
      accessor: 'name',
      cell: ({ row }) => <code>{row.original.name}</code>,
    },
    {
      id: 'technology',
      header: 'Teknoloji',
      cell: ({ row }) =>
        catalogue.get(row.original.technologyId)?.name ?? row.original.technologyId,
    },
    { id: 'purpose', header: 'Amaç', accessor: 'purpose' },
    {
      id: 'personalData',
      header: 'Kişisel veri',
      cell: ({ row }) => (row.original.containsPersonalData ? 'Evet' : 'Hayır'),
    },
  ];
}
