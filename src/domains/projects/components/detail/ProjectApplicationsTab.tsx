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
  return (
    <SectionCard
      title="Etkilenen uygulamalar"
      description="Bu projenin oluşturduğu, değiştirdiği, entegre olduğu veya devreden çıkardığı uygulamalar."
    >
      <Table
        data={project.applicationImpacts}
        columns={columns}
        getRowId={(row) => `${row.applicationId}-${row.impactType}`}
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
