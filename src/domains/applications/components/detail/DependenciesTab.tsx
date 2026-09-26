import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationDependencies } from '@/domains/connections/api/queries';
import type { ApplicationDependency, DependencyDirection } from '@/domains/connections/types';
import { DEPENDENCY_TYPE_LABELS } from '@/domains/connections/utils/connectionPresentation';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import type { Application } from '../../types';
import { ApplicationRefLink } from '../ApplicationRefLink';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';

/** Most critical first — that is what someone assessing impact needs to see. */
const byCriticalityDesc = (a: ApplicationDependency, b: ApplicationDependency) =>
  CRITICALITIES.indexOf(b.criticality) - CRITICALITIES.indexOf(a.criticality);

function columns(
  direction: DependencyDirection,
  canEdit: boolean,
): TableColumnDef<ApplicationDependency>[] {
  return [
    {
      id: 'application',
      header: 'Application',
      cell: ({ row }) => (
        <ApplicationRefLink
          applicationId={
            direction === 'outgoing'
              ? row.original.targetApplicationId
              : row.original.sourceApplicationId
          }
        />
      ),
    },
    { id: 'type', header: 'Type', cell: ({ row }) => DEPENDENCY_TYPE_LABELS[row.original.type] },
    {
      id: 'criticality',
      header: 'Impact if unavailable',
      cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
    },
    { id: 'description', header: 'Description', accessor: 'description' },
    ...(canEdit
      ? [
          editColumn<ApplicationDependency>(
            (dependency) => paths.dependencies.edit(dependency.id),
            () => 'dependency',
          ),
        ]
      : []),
  ];
}

export function DependenciesTab({ application }: { application: Application }) {
  const query = useApplicationDependencies(application.id);
  const canEdit = usePermission('portfolio:edit');

  return (
    <QueryView
      query={query}
      loadingLabel="Loading dependencies"
      errorTitle="Dependencies could not be loaded"
    >
      {({ outgoing, incoming }) => (
        <div className="c-stack">
          <SectionCard
            title={`Depends on (${outgoing.length})`}
            description={`Applications ${application.name} needs in order to work.`}
            actions={
              <SmallCreateAction
                to={paths.dependencies.create(application.id)}
                label="Add dependency"
              />
            }
          >
            <Table
              data={[...outgoing].sort(byCriticalityDesc)}
              columns={columns('outgoing', canEdit)}
              getRowId={(row) => row.id}
              emptyState={
                <EmptyState
                  compact
                  title={`${application.name} has no recorded dependencies on other applications`}
                />
              }
            />
          </SectionCard>
          <SectionCard
            title={`Used by (${incoming.length})`}
            description={`Applications affected when ${application.name} is unavailable.`}
          >
            <Table
              data={[...incoming].sort(byCriticalityDesc)}
              columns={columns('incoming', canEdit)}
              getRowId={(row) => row.id}
              emptyState={
                <EmptyState
                  compact
                  title={`No applications are recorded as depending on ${application.name}`}
                />
              }
            />
          </SectionCard>
        </div>
      )}
    </QueryView>
  );
}
