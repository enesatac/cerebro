import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { LIFECYCLE_PRESENTATION } from '@/domains/applications/utils/applicationPresentation';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { TECHNOLOGY_STATUS_PRESENTATION } from '@/domains/technologies/utils/technologyPresentation';
import type { ApplicationHealthRow } from '../types';

const columns: TableColumnDef<ApplicationHealthRow>[] = [
  {
    id: 'name',
    header: 'Application',
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
    header: 'Lifecycle',
    width: 120,
    cell: ({ row }) => <StatusBadge {...LIFECYCLE_PRESENTATION[row.original.lifecycle]} />,
  },
  {
    id: 'criticality',
    header: 'Criticality',
    width: 110,
    cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
  },
  {
    id: 'technologies',
    header: 'Outdated technologies',
    cell: ({ row }) => (
      <ul className="c-inline-list">
        {row.original.outdatedTechnologies.map((tech) => (
          <li key={tech.id} className="c-tech-item">
            <EntityLink to={paths.technologies.detail(tech.id)}>{tech.name}</EntityLink>
            <StatusBadge
              {...TECHNOLOGY_STATUS_PRESENTATION[tech.status]}
              context="Technology status:"
            />
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'owner',
    header: 'Technical owner',
    width: 150,
    cell: ({ row }) =>
      row.original.technicalOwner?.name ?? <span className="c-text-warning">Unassigned</span>,
  },
];

/** Live applications running on deprecated or retired catalogue technologies, most critical first. */
export function TechnologyRiskReport({ rows }: { rows: ApplicationHealthRow[] }) {
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
      title={`Applications on outdated technology (${affected.length})`}
      description="Retired technologies are unsupported and listed first; deprecated ones should not be used for new work."
    >
      <Table
        data={affected}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState compact title="No live application uses deprecated or retired technology" />
        }
      />
    </SectionCard>
  );
}
