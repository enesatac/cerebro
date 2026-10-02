import { loadPortfolioNames } from '@/domains/shared/utils/portfolioNames';
import { useRepositories } from '@/services/RepositoryContext';
import { TableExportBar } from '@/components/actions/TableExportBar';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationIntegrations } from '@/domains/connections/api/queries';
import type { Integration, IntegrationDirection } from '@/domains/connections/types';
import type { Application } from '../../types';
import { ApplicationRefLink } from '../ApplicationRefLink';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { IntegrationDeleteAction } from '@/domains/connections/components/IntegrationDeleteAction';

function Counterpart({
  integration,
  direction,
}: {
  integration: Integration;
  direction: IntegrationDirection;
}) {
  const applicationId =
    direction === 'outbound' ? integration.toApplicationId : integration.fromApplicationId;
  if (applicationId) return <ApplicationRefLink applicationId={applicationId} />;
  return (
    <span className="c-cell-stack">
      <span>{integration.externalPartyName ?? 'Bilinmeyen taraf'}</span>
      <span className="c-muted c-cell-stack__secondary">Harici</span>
    </span>
  );
}

function columns(direction: IntegrationDirection, canEdit: boolean): TableColumnDef<Integration>[] {
  return [
    {
      id: 'name',
      header: 'Entegrasyon',
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>{row.original.name}</span>
          <span className="c-muted c-cell-stack__secondary">{row.original.description}</span>
        </span>
      ),
    },
    {
      id: 'counterpart',
      header: direction === 'outbound' ? 'Hedef' : 'Kaynak',
      cell: ({ row }) => <Counterpart integration={row.original} direction={direction} />,
    },
    {
      id: 'type',
      header: 'Tür',
      cell: ({ row }) => <MasterLabel list="integrationTypes" code={row.original.type} />,
    },
    {
      id: 'frequency',
      header: 'Sıklık',
      cell: ({ row }) => (
        <MasterLabel list="integrationFrequencies" code={row.original.frequency} />
      ),
    },
    { id: 'data', header: 'Aktarılan veri', accessor: 'dataExchanged' },
    ...(canEdit
      ? [
          editColumn<Integration>(
            (integration) => paths.integrations.edit(integration.id),
            (integration) => integration.name,
            (integration) => <IntegrationDeleteAction record={integration} compact />,
          ),
        ]
      : []),
  ];
}

export function IntegrationsTab({ application }: { application: Application }) {
  const query = useApplicationIntegrations(application.id);
  const canEdit = usePermission('portfolio:edit');
  const masterData = useMasterData();
  const repositories = useRepositories();
  const integrationSheet = (
    nameOf: (id: number) => string,
    name: string,
    title: string,
    rows: Integration[],
    direction: IntegrationDirection,
  ) =>
    sheet<Integration>({
      name,
      title,
      rows,
      columns: [
        { header: 'Entegrasyon', value: (i) => i.name },
        {
          header: direction === 'outbound' ? 'Hedef' : 'Kaynak',
          value: (i) =>
            direction === 'inbound'
              ? nameOf(i.fromApplicationId)
              : i.toApplicationId
                ? nameOf(i.toApplicationId)
                : `${i.externalPartyName ?? ''} (harici)`,
        },
        { header: 'Tür', value: (i) => masterData.label('integrationTypes', i.type) },
        { header: 'Sıklık', value: (i) => masterData.label('integrationFrequencies', i.frequency) },
        { header: 'Aktarılan veri', value: (i) => i.dataExchanged, width: 40 },
        { header: 'Açıklama', value: (i) => i.description, width: 50 },
      ],
    });

  return (
    <QueryView
      query={query}
      loadingLabel="Entegrasyonlar yükleniyor"
      errorTitle="Entegrasyonlar yüklenemedi"
    >
      {({ outbound, inbound }) => (
        <div className="c-stack">
          <TableExportBar
            title={`${application.name} — entegrasyonlar`}
            disabled={outbound.length + inbound.length === 0}
            build={async () => {
              const names = await loadPortfolioNames(repositories);
              return [
                integrationSheet(
                  names.application,
                  'Giden',
                  `${application.name} giden entegrasyonlar`,
                  outbound,
                  'outbound',
                ),
                integrationSheet(
                  names.application,
                  'Gelen',
                  `${application.name} gelen entegrasyonlar`,
                  inbound,
                  'inbound',
                ),
              ];
            }}
          />
          <SectionCard
            title={`Giden (${outbound.length})`}
            description={`${application.name} uygulamasının çağırdığı veya yayın yaptığı arayüzler.`}
            actions={
              <SmallCreateAction
                to={paths.integrations.create(application.id)}
                label="Entegrasyon ekle"
              />
            }
          >
            <Table
              data={outbound}
              columns={columns('outbound', canEdit)}
              getRowId={(row) => String(row.id)}
              emptyState={<EmptyState compact title="Kayıtlı giden entegrasyon yok" />}
            />
          </SectionCard>
          <SectionCard
            title={`Gelen (${inbound.length})`}
            description={`Diğer sistemlerin ${application.name} uygulamasını çağırdığı veya veri gönderdiği arayüzler.`}
          >
            <Table
              data={inbound}
              columns={columns('inbound', canEdit)}
              getRowId={(row) => String(row.id)}
              emptyState={<EmptyState compact title="Kayıtlı gelen entegrasyon yok" />}
            />
          </SectionCard>
        </div>
      )}
    </QueryView>
  );
}
