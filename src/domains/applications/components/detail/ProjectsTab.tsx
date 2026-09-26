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
    header: 'Proje',
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
    header: 'Etki',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <span>{APPLICATION_IMPACT_LABELS[row.original.impact.impactType]}</span>
        <span className="c-muted c-cell-stack__secondary">{row.original.impact.description}</span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Durum',
    cell: ({ row }) => (
      <StatusBadge {...PROJECT_STATUS_PRESENTATION[row.original.project.status]} />
    ),
  },
  {
    id: 'health',
    header: 'Sağlık',
    cell: ({ row }) => (
      <StatusBadge {...PROJECT_HEALTH_PRESENTATION[row.original.project.health]} />
    ),
  },
  {
    id: 'manager',
    header: 'Proje yöneticisi',
    cell: ({ row }) => row.original.project.projectManager?.name ?? '—',
  },
  {
    id: 'end',
    header: 'Planlanan bitiş',
    align: 'end',
    cell: ({ row }) => formatDate(row.original.project.plannedEndDate),
  },
];

export function ProjectsTab({ application }: { application: Application }) {
  const query = useProjectsByApplication(application.id);
  return (
    <QueryView
      query={query}
      loadingLabel="Projeler yükleniyor"
      errorTitle="İlgili projeler yüklenemedi"
    >
      {(links) => (
        <SectionCard
          title="Bu uygulamayı etkileyen projeler"
          description="Planlanan ve süren değişiklikler ile bunların bu uygulamaya etkisi."
        >
          <Table
            data={links}
            columns={columns}
            getRowId={(row) => `${row.project.id}-${row.impact.impactType}`}
            emptyState={
              <EmptyState
                compact
                title={`${application.name} uygulamasını etkileyen kayıtlı proje yok`}
              />
            }
          />
        </SectionCard>
      )}
    </QueryView>
  );
}
