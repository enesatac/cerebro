import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationDependencies } from '@/domains/connections/api/queries';
import type { ApplicationDependency, DependencyDirection } from '@/domains/connections/types';
import { CRITICALITIES } from '@/domains/shared/types';
import type { Application } from '../../types';
import { ApplicationRefLink } from '../ApplicationRefLink';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { DependencyDeleteAction } from '@/domains/connections/components/DependencyDeleteAction';

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
      header: 'Uygulama',
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
    {
      id: 'type',
      header: 'Tür',
      cell: ({ row }) => <MasterLabel list="dependencyTypes" code={row.original.type} />,
    },
    {
      id: 'criticality',
      header: 'Erişilemezse etkisi',
      cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.criticality} />,
    },
    { id: 'description', header: 'Açıklama', accessor: 'description' },
    ...(canEdit
      ? [
          editColumn<ApplicationDependency>(
            (dependency) => paths.dependencies.edit(dependency.id),
            () => 'bağımlılık',
            (dependency) => <DependencyDeleteAction record={dependency} compact />,
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
      loadingLabel="Bağımlılıklar yükleniyor"
      errorTitle="Bağımlılıklar yüklenemedi"
    >
      {({ outgoing, incoming }) => (
        <div className="c-stack">
          <SectionCard
            title={`Bağımlı olduğu (${outgoing.length})`}
            description={`${application.name} uygulamasının çalışmak için ihtiyaç duyduğu uygulamalar.`}
            actions={
              <SmallCreateAction
                to={paths.dependencies.create(application.id)}
                label="Bağımlılık ekle"
              />
            }
          >
            <Table
              data={[...outgoing].sort(byCriticalityDesc)}
              columns={columns('outgoing', canEdit)}
              getRowId={(row) => String(row.id)}
              emptyState={
                <EmptyState
                  compact
                  title={`${application.name} için diğer uygulamalara kayıtlı bağımlılık yok`}
                />
              }
            />
          </SectionCard>
          <SectionCard
            title={`Kullananlar (${incoming.length})`}
            description={`${application.name} erişilemez olduğunda etkilenen uygulamalar.`}
          >
            <Table
              data={[...incoming].sort(byCriticalityDesc)}
              columns={columns('incoming', canEdit)}
              getRowId={(row) => String(row.id)}
              emptyState={
                <EmptyState
                  compact
                  title={`${application.name} uygulamasına bağımlı olarak kayıtlı uygulama yok`}
                />
              }
            />
          </SectionCard>
        </div>
      )}
    </QueryView>
  );
}
