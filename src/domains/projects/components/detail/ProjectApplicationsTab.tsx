import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useRepositories } from '@/services/RepositoryContext';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { ApplicationRefLink } from '@/domains/applications/components/ApplicationRefLink';
import type { Project, ProjectApplicationImpact } from '../../types';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';

const columns: TableColumnDef<ProjectApplicationImpact>[] = [
  {
    id: 'application',
    header: 'Uygulama',
    width: 260,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.applicationId} />,
  },
  {
    id: 'impact',
    header: 'Etki',
    width: 150,
    cell: ({ row }) => <MasterLabel list="applicationImpactTypes" code={row.original.impactType} />,
  },
  { id: 'description', header: 'Ne değişiyor', accessor: 'description' },
];

export function ProjectApplicationsTab({ project }: { project: Project }) {
  const masterData = useMasterData();
  const repositories = useRepositories();
  return (
    <SectionCard
      title="Etkilenen uygulamalar"
      description="Bu projenin oluşturduğu, değiştirdiği, entegre olduğu veya devreden çıkardığı uygulamalar."
      actions={
        <ExcelExportButton
          title={`${project.name} — etkilenen uygulamalar`}
          disabled={project.applicationImpacts.length === 0}
          build={async () => {
            const apps = new Map(
              (await repositories.applications.listRefs()).map((ref) => [ref.id, ref]),
            );
            return [
              sheet<ProjectApplicationImpact>({
                name: 'Etkilenen uygulamalar',
                title: `${project.name} — etkilenen uygulamalar`,
                rows: project.applicationImpacts,
                columns: [
                  {
                    header: 'Uygulama',
                    value: (i) => apps.get(i.applicationId)?.name ?? `#${i.applicationId}`,
                  },
                  { header: 'Kod', value: (i) => apps.get(i.applicationId)?.code },
                  {
                    header: 'Etki',
                    value: (i) => masterData.label('applicationImpactTypes', i.impactType),
                  },
                  { header: 'Ne değişiyor', value: (i) => i.description, width: 60 },
                ],
              }),
            ];
          }}
        />
      }
    >
      <Table
        data={project.applicationImpacts}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={
          <EmptyState
            compact
            title="Bu projeye henüz uygulama bağlanmadı"
            description="Sahiplerin gelen değişiklikleri görebilmesi için projenin değiştirdiği her uygulamayı bağlayın."
          />
        }
      />
    </SectionCard>
  );
}
