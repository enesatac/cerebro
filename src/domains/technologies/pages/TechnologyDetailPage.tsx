import { Alert, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationList } from '@/domains/applications/api/queries';
import type { ApplicationListItem } from '@/domains/applications/types';
import { LIFECYCLE_PRESENTATION } from '@/domains/applications/utils/applicationPresentation';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { isNotFoundError } from '@/lib/errors';
import { useTechnology } from '../api/queries';
import type { Technology } from '../types';
import {
  TECHNOLOGY_CATEGORY_LABELS,
  TECHNOLOGY_STATUS_PRESENTATION,
} from '../utils/technologyPresentation';
import { EditAction } from '@/domains/auth/components/RecordActions';

const USAGE_PAGE_SIZE = 100;

const columns: TableColumnDef<ApplicationListItem>[] = [
  {
    id: 'name',
    header: 'Application',
    width: 260,
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
    cell: ({ row }) => <StatusBadge {...LIFECYCLE_PRESENTATION[row.original.lifecycle]} />,
  },
  {
    id: 'criticality',
    header: 'Criticality',
    cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
  },
  {
    id: 'owner',
    header: 'Technical owner',
    cell: ({ row }) =>
      row.original.technicalOwner?.name ?? <span className="c-text-warning">Unassigned</span>,
  },
  { id: 'bu', header: 'Business unit', cell: ({ row }) => row.original.businessUnit?.name ?? '—' },
];

function UsedBy({ technology }: { technology: Technology }) {
  const query = useApplicationList({
    technologyId: technology.id,
    page: 0,
    pageSize: USAGE_PAGE_SIZE,
    sort: { field: 'criticality', direction: 'desc' },
  });
  return (
    <QueryView
      query={query}
      loadingLabel="Loading applications"
      errorTitle="Usage could not be loaded"
    >
      {(result) => (
        <SectionCard
          title={`Used by (${result.total})`}
          description="Applications that record this technology in their stack, most critical first."
        >
          <Table
            data={result.items}
            columns={columns}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState compact title={`No application records using ${technology.name}`} />
            }
          />
        </SectionCard>
      )}
    </QueryView>
  );
}

export default function TechnologyDetailPage() {
  const { technologyId = '' } = useParams();
  const query = useTechnology(technologyId);

  if (query.isPending) return <LoadingState label="Loading technology" />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Technology not found"
        description={`No technology with the id "${technologyId}" exists in the catalogue.`}
        backTo={paths.technologies.list()}
        backLabel="Back to technologies"
      />
    ) : (
      <ErrorState
        title="This technology could not be loaded"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const technology = query.data;
  const outdated = technology.status === 'deprecated' || technology.status === 'retired';
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Technologies', to: paths.technologies.list() },
          { label: technology.name },
        ]}
        title={technology.name}
        actions={<EditAction to={paths.technologies.edit(technology.id)} />}
        subtitle={technology.description}
        meta={
          <>
            <span className="c-muted">{TECHNOLOGY_CATEGORY_LABELS[technology.category]}</span>
            <StatusBadge context="Status:" {...TECHNOLOGY_STATUS_PRESENTATION[technology.status]} />
          </>
        }
      />
      {outdated && (
        <Alert
          variant={technology.status === 'retired' ? 'danger' : 'warning'}
          appearance="outlined"
        >
          <Alert.Content>
            <Alert.Title level={2}>
              {technology.name} is {technology.status}
            </Alert.Title>
            <Alert.Description>
              {technology.status === 'retired'
                ? 'It is no longer supported. Applications below should be migrated or retired.'
                : 'New work should not use it. Applications below should plan a migration.'}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      <UsedBy technology={technology} />
    </div>
  );
}
