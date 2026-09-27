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

  return (
    <QueryView
      query={query}
      loadingLabel="Entegrasyonlar yükleniyor"
      errorTitle="Entegrasyonlar yüklenemedi"
    >
      {({ outbound, inbound }) => (
        <div className="c-stack">
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
