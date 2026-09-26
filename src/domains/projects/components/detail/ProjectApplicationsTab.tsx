import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { ApplicationRefLink } from '@/domains/applications/components/ApplicationRefLink';
import type { Project, ProjectApplicationImpact } from '../../types';
import { APPLICATION_IMPACT_LABELS } from '../../utils/projectPresentation';

const columns: TableColumnDef<ProjectApplicationImpact>[] = [
  {
    id: 'application',
    header: 'Application',
    width: 260,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.applicationId} />,
  },
  {
    id: 'impact',
    header: 'Impact',
    width: 150,
    cell: ({ row }) => APPLICATION_IMPACT_LABELS[row.original.impactType],
  },
  { id: 'description', header: 'What changes', accessor: 'description' },
];

export function ProjectApplicationsTab({ project }: { project: Project }) {
  return (
    <SectionCard
      title="Affected applications"
      description="Applications this project creates, modifies, integrates with or decommissions."
    >
      <Table
        data={project.applicationImpacts}
        columns={columns}
        getRowId={(row) => `${row.applicationId}-${row.impactType}`}
        emptyState={
          <EmptyState
            compact
            title="No applications are linked to this project yet"
            description="Link every application the project changes so owners can see incoming change."
          />
        }
      />
    </SectionCard>
  );
}
