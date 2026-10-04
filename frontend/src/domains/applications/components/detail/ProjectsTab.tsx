import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useProjectsByApplication } from '@/domains/projects/api/queries';
import type { ApplicationProjectLink } from '@/domains/projects/types';
import { formatDate } from '@/lib/dates';
import type { Application } from '../../types';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';

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
        <span>
          <MasterLabel list="applicationImpactTypes" code={row.original.impact.impactType} />
        </span>
        <span className="c-muted c-cell-stack__secondary">{row.original.impact.description}</span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Durum',
    cell: ({ row }) => <MasterBadge list="projectStatuses" code={row.original.project.status} />,
  },
  {
    id: 'health',
    header: 'Sağlık',
    cell: ({ row }) => <MasterBadge list="projectHealths" code={row.original.project.health} />,
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
  const masterData = useMasterData();
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
          actions={
            <ExcelExportButton
              title={`${application.name} — projeler`}
              disabled={links.length === 0}
              build={() => [
                sheet<ApplicationProjectLink>({
                  name: 'Projeler',
                  title: `${application.name} uygulamasını etkileyen projeler`,
                  rows: links,
                  columns: [
                    { header: 'Kod', value: (l) => l.project.code },
                    { header: 'Proje', value: (l) => l.project.name },
                    {
                      header: 'Etki',
                      value: (l) => masterData.label('applicationImpactTypes', l.impact.impactType),
                    },
                    { header: 'Etki açıklaması', value: (l) => l.impact.description, width: 50 },
                    {
                      header: 'Durum',
                      value: (l) => masterData.label('projectStatuses', l.project.status),
                    },
                    {
                      header: 'Sağlık',
                      value: (l) => masterData.label('projectHealths', l.project.health),
                    },
                    { header: 'Proje yöneticisi', value: (l) => l.project.projectManager?.name },
                    {
                      header: 'Planlanan bitiş',
                      value: (l) => l.project.plannedEndDate,
                      type: 'date',
                    },
                  ],
                }),
              ]}
            />
          }
        >
          <Table
            data={links}
            columns={columns}
            getRowId={(row) => String(row.impact.id)}
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
