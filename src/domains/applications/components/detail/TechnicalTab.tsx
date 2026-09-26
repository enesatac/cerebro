import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { DetailList } from '@/components/data-display/DetailList';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { useTechnologiesById } from '@/domains/technologies/api/queries';
import { TECHNOLOGY_CATEGORIES, type Technology } from '@/domains/technologies/types';
import {
  TECHNOLOGY_CATEGORY_LABELS,
  TECHNOLOGY_STATUS_PRESENTATION,
} from '@/domains/technologies/utils/technologyPresentation';
import type { Application, DataStore } from '../../types';
import { HOSTING_MODEL_LABELS } from '../../utils/applicationPresentation';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';

export function TechnicalTab({ application }: { application: Application }) {
  const technologies = useTechnologiesById();
  const catalogue = technologies.data ?? new Map<string, Technology>();

  return (
    <div className="c-stack">
      <SectionCard
        title="Technology stack"
        description="Catalogued technologies grouped by the layer they are used in."
      >
        {application.technologies.length === 0 ? (
          <EmptyState
            compact
            title="No technologies have been recorded for this application"
            description={
              application.hosting.model === 'saas'
                ? 'This is a vendor-hosted product; record technologies only if your teams build on it.'
                : 'Add the frontend, backend, database and infrastructure technologies it runs on.'
            }
          />
        ) : (
          <DetailList
            items={TECHNOLOGY_CATEGORIES.filter((layer) =>
              application.technologies.some((usage) => usage.layer === layer),
            ).map((layer) => ({
              label: TECHNOLOGY_CATEGORY_LABELS[layer],
              value: (
                <ul className="c-inline-list">
                  {application.technologies
                    .filter((usage) => usage.layer === layer)
                    .map((usage) => {
                      const technology = catalogue.get(usage.technologyId);
                      const status = technology
                        ? TECHNOLOGY_STATUS_PRESENTATION[technology.status]
                        : null;
                      return (
                        <li key={`${usage.technologyId}-${layer}`} className="c-tech-item">
                          <span>
                            <EntityLink to={paths.technologies.detail(usage.technologyId)}>
                              {technology?.name ?? usage.technologyId}
                            </EntityLink>
                            {usage.version && <span className="c-muted"> {usage.version}</span>}
                          </span>
                          {technology &&
                            technology.status !== 'preferred' &&
                            technology.status !== 'supported' &&
                            status && <StatusBadge {...status} context="Technology status:" />}
                        </li>
                      );
                    })}
                </ul>
              ),
            }))}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Data stores"
        description="Databases and caches owned by this application."
      >
        <Table
          data={application.dataStores}
          columns={dataStoreColumns(catalogue)}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState compact title="No data stores have been recorded for this application" />
          }
        />
      </SectionCard>

      <SectionCard title="Hosting">
        <DetailList
          items={[
            { label: 'Hosting model', value: HOSTING_MODEL_LABELS[application.hosting.model] },
            {
              label: 'Cloud provider',
              value: application.hosting.cloudProvider,
              emptyText: 'Not applicable',
            },
            { label: 'Notes', value: application.hosting.notes },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function dataStoreColumns(catalogue: Map<string, Technology>): TableColumnDef<DataStore>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      cell: ({ row }) => <code>{row.original.name}</code>,
    },
    {
      id: 'technology',
      header: 'Technology',
      cell: ({ row }) =>
        catalogue.get(row.original.technologyId)?.name ?? row.original.technologyId,
    },
    { id: 'purpose', header: 'Purpose', accessor: 'purpose' },
    {
      id: 'personalData',
      header: 'Personal data',
      cell: ({ row }) => (row.original.containsPersonalData ? 'Yes' : 'No'),
    },
  ];
}
