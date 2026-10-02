import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useMasterData } from '@/domains/master-data/context';
import { sheet } from '@/lib/xlsxTypes';
import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { CRITICALITIES } from '@/domains/shared/types';
import type { ApplicationHealthRow } from '../types';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';

const columns: TableColumnDef<ApplicationHealthRow>[] = [
  {
    id: 'name',
    header: 'Uygulama',
    width: 240,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <EntityLink to={paths.applications.detail(row.original.id)}>{row.original.name}</EntityLink>
        <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
      </span>
    ),
  },
  {
    id: 'lifecycle',
    header: 'Yaşam döngüsü',
    width: 120,
    cell: ({ row }) => <MasterBadge list="applicationLifecycles" code={row.original.lifecycle} />,
  },
  {
    id: 'criticality',
    header: 'Kritiklik',
    width: 110,
    cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.criticality} />,
  },
  {
    id: 'technologies',
    header: 'Güncelliğini yitirmiş teknolojiler',
    cell: ({ row }) => (
      <ul className="c-inline-list">
        {row.original.outdatedTechnologies.map((tech) => (
          <li key={tech.id} className="c-tech-item">
            <EntityLink to={paths.technologies.detail(tech.id)}>{tech.name}</EntityLink>
            <MasterBadge list="technologyStatuses" code={tech.status} context="Teknoloji durumu:" />
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'owner',
    header: 'Teknik sahip',
    width: 150,
    cell: ({ row }) =>
      row.original.technicalOwner?.name ?? <span className="c-text-warning">Atanmamış</span>,
  },
];

/** Live applications running on deprecated or retired catalogue technologies, most critical first. */
export function TechnologyRiskReport({ rows }: { rows: ApplicationHealthRow[] }) {
  const masterData = useMasterData();
  const affected = rows
    .filter((row) => row.lifecycle !== 'retired' && row.outdatedTechnologies.length > 0)
    .sort(
      (a, b) =>
        Number(b.outdatedTechnologies.some((t) => t.status === 'retired')) -
          Number(a.outdatedTechnologies.some((t) => t.status === 'retired')) ||
        CRITICALITIES.indexOf(b.criticality) - CRITICALITIES.indexOf(a.criticality),
    );
  return (
    <SectionCard
      title={`Güncelliğini yitirmiş teknoloji kullanan uygulamalar (${affected.length})`}
      description="Emekli teknolojiler artık desteklenmez ve önce listelenir; kullanımdan kalkanlar yeni işlerde kullanılmamalıdır."
      actions={
        <ExcelExportButton
          title="Teknoloji riski raporu"
          disabled={affected.length === 0}
          build={() => [
            sheet<{
              row: ApplicationHealthRow;
              tech: ApplicationHealthRow['outdatedTechnologies'][number];
            }>({
              name: 'Teknoloji riski',
              title: 'Güncelliğini yitirmiş teknoloji kullanan uygulamalar',
              // One row per application × technology: easy to filter and pivot in Excel.
              rows: affected.flatMap((row) =>
                row.outdatedTechnologies.map((tech) => ({ row, tech })),
              ),
              columns: [
                { header: 'Kod', value: (r) => r.row.code },
                { header: 'Uygulama', value: (r) => r.row.name },
                {
                  header: 'Yaşam döngüsü',
                  value: (r) => masterData.label('applicationLifecycles', r.row.lifecycle),
                },
                {
                  header: 'Kritiklik',
                  value: (r) => masterData.label('criticalities', r.row.criticality),
                },
                { header: 'Teknoloji', value: (r) => r.tech.name },
                {
                  header: 'Teknoloji durumu',
                  value: (r) => masterData.label('technologyStatuses', r.tech.status),
                },
                { header: 'Teknik sahip', value: (r) => r.row.technicalOwner?.name ?? 'Atanmamış' },
                { header: 'İş birimi', value: (r) => r.row.businessUnit?.name },
              ],
            }),
          ]}
        />
      }
    >
      <Table
        data={affected}
        columns={columns}
        getRowId={(row) => String(row.id)}
        emptyState={
          <EmptyState
            compact
            title="Hiçbir canlı uygulama kullanımdan kalkan veya emekli teknoloji kullanmıyor"
          />
        }
      />
    </SectionCard>
  );
}
