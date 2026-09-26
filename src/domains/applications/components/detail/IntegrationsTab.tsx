import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationIntegrations } from '@/domains/connections/api/queries';
import type { Integration, IntegrationDirection } from '@/domains/connections/types';
import {
  INTEGRATION_FREQUENCY_LABELS,
  INTEGRATION_TYPE_LABELS,
} from '@/domains/connections/utils/connectionPresentation';
import type { Application } from '../../types';
import { ApplicationRefLink } from '../ApplicationRefLink';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';

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
      <span>{integration.externalPartyName ?? 'Unknown party'}</span>
      <span className="c-muted c-cell-stack__secondary">External</span>
    </span>
  );
}

function columns(direction: IntegrationDirection, canEdit: boolean): TableColumnDef<Integration>[] {
  return [
    {
      id: 'name',
      header: 'Integration',
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>{row.original.name}</span>
          <span className="c-muted c-cell-stack__secondary">{row.original.description}</span>
        </span>
      ),
    },
    {
      id: 'counterpart',
      header: direction === 'outbound' ? 'Target' : 'Source',
      cell: ({ row }) => <Counterpart integration={row.original} direction={direction} />,
    },
    { id: 'type', header: 'Type', cell: ({ row }) => INTEGRATION_TYPE_LABELS[row.original.type] },
    {
      id: 'frequency',
      header: 'Frequency',
      cell: ({ row }) => INTEGRATION_FREQUENCY_LABELS[row.original.frequency],
    },
    { id: 'data', header: 'Data exchanged', accessor: 'dataExchanged' },
    ...(canEdit
      ? [
          editColumn<Integration>(
            (integration) => paths.integrations.edit(integration.id),
            (integration) => integration.name,
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
      loadingLabel="Loading integrations"
      errorTitle="Integrations could not be loaded"
    >
      {({ outbound, inbound }) => (
        <div className="c-stack">
          <SectionCard
            title={`Outbound (${outbound.length})`}
            description={`Interfaces ${application.name} calls or publishes to.`}
            actions={
              <SmallCreateAction
                to={paths.integrations.create(application.id)}
                label="Add integration"
              />
            }
          >
            <Table
              data={outbound}
              columns={columns('outbound', canEdit)}
              getRowId={(row) => row.id}
              emptyState={
                <EmptyState compact title="No outbound integrations have been recorded" />
              }
            />
          </SectionCard>
          <SectionCard
            title={`Inbound (${inbound.length})`}
            description={`Interfaces through which other systems call or send data to ${application.name}.`}
          >
            <Table
              data={inbound}
              columns={columns('inbound', canEdit)}
              getRowId={(row) => row.id}
              emptyState={<EmptyState compact title="No inbound integrations have been recorded" />}
            />
          </SectionCard>
        </div>
      )}
    </QueryView>
  );
}
