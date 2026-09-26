import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useProjectsByApplication } from '@/domains/projects/api/queries';
import type { ApplicationProjectLink } from '@/domains/projects/types';
import {
  APPLICATION_IMPACT_LABELS,
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_STATUS_PRESENTATION,
} from '@/domains/projects/utils/projectPresentation';
import { formatDate } from '@/lib/dates';
import type { Application } from '../../types';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';

const columns: TableColumnDef<ApplicationProjectLink>[] = [
  {
    id: 'project',
    header: 'Project',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <EntityLink to={paths.projects.detail(row.original.project.id)}>
          {row.original.project.name}
        </EntityLink>
        <span className="c-muted c-cell-stack__secondary">{row.original.project.code}</span>
      </span>
    ),
  },
  {
    id: 'impact',
    header: 'Impact',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <span>{APPLICATION_IMPACT_LABELS[row.original.impact.impactType]}</span>
        <span className="c-muted c-cell-stack__secondary">{row.original.impact.description}</span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge {...PROJECT_STATUS_PRESENTATION[row.original.project.status]} />
    ),
  },
  {
    id: 'health',
    header: 'Health',
    cell: ({ row }) => (
      <StatusBadge {...PROJECT_HEALTH_PRESENTATION[row.original.project.health]} />
    ),
  },
  {
    id: 'manager',
    header: 'Project manager',
    cell: ({ row }) => row.original.project.projectManager?.name ?? '—',
  },
  {
    id: 'end',
    header: 'Planned end',
    align: 'end',
    cell: ({ row }) => formatDate(row.original.project.plannedEndDate),
  },
];

export function ProjectsTab({ application }: { application: Application }) {
  const query = useProjectsByApplication(application.id);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading projects"
      errorTitle="Related projects could not be loaded"
    >
      {(links) => (
        <SectionCard
          title="Projects affecting this application"
          description="Planned and in-flight change, and what it does to this application."
        >
          <Table
            data={links}
            columns={columns}
            getRowId={(row) => `${row.project.id}-${row.impact.impactType}`}
            emptyState={
              <EmptyState
                compact
                title={`No projects are recorded as affecting ${application.name}`}
              />
            }
          />
        </SectionCard>
      )}
    </QueryView>
  );
}
