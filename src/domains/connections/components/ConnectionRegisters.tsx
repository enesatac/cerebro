import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { ApplicationRefLink } from '@/domains/applications/components/ApplicationRefLink';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { pluralize } from '@/lib/format';
import { oneOf } from '@/lib/urlParams';
import { useAllDependencies, useAllIntegrations } from '../api/queries';
import {
  DEPENDENCY_TYPES,
  INTEGRATION_TYPES,
  type ApplicationDependency,
  type Integration,
} from '../types';
import {
  DEPENDENCY_TYPE_LABELS,
  INTEGRATION_FREQUENCY_LABELS,
  INTEGRATION_TYPE_LABELS,
} from '../utils/connectionPresentation';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';

const PAGINATION = { pageSize: 25, pageSizeOptions: [25, 50, 100] };

function useParamFilter<T extends string>(key: string, allowed: readonly T[]) {
  const [params, setParams] = useSearchParams();
  const value = oneOf(allowed, params.get(key));
  const set = (next: string | null) => {
    const updated = new URLSearchParams(params);
    if (next) updated.set(key, next);
    else updated.delete(key);
    setParams(updated, { replace: true });
  };
  return [value, set] as const;
}

const dependencyColumns: TableColumnDef<ApplicationDependency>[] = [
  {
    id: 'source',
    header: 'Application',
    width: 220,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.sourceApplicationId} />,
  },
  {
    id: 'target',
    header: 'Depends on',
    width: 220,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.targetApplicationId} />,
  },
  {
    id: 'type',
    header: 'Type',
    width: 130,
    cell: ({ row }) => DEPENDENCY_TYPE_LABELS[row.original.type],
  },
  {
    id: 'criticality',
    header: 'Impact if unavailable',
    width: 150,
    cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
  },
  { id: 'description', header: 'Description', accessor: 'description' },
];

export function DependencyRegister() {
  const query = useAllDependencies();
  const canEdit = usePermission('portfolio:edit');
  const [type, setType] = useParamFilter('type', DEPENDENCY_TYPES);
  const [criticality, setCriticality] = useParamFilter('criticality', CRITICALITIES);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading dependencies"
      errorTitle="Dependencies could not be loaded"
    >
      {(all) => {
        const visible = all
          .filter(
            (d) => (!type || d.type === type) && (!criticality || d.criticality === criticality),
          )
          .sort(
            (a, b) => CRITICALITIES.indexOf(b.criticality) - CRITICALITIES.indexOf(a.criticality),
          );
        return (
          <>
            <Toolbar
              label="Filter dependencies"
              add={<SmallCreateAction to={paths.dependencies.create()} label="Record dependency" />}
              end={
                <FilterSummary
                  summary={pluralize(visible.length, 'dependency', 'dependencies')}
                  activeFilterCount={[type, criticality].filter(Boolean).length}
                  onReset={() => {
                    setType(null);
                    setCriticality(null);
                  }}
                />
              }
            >
              <FilterSelect
                label="Type"
                allLabel="All types"
                value={type}
                options={DEPENDENCY_TYPES.map((value) => ({
                  value,
                  label: DEPENDENCY_TYPE_LABELS[value],
                }))}
                onChange={setType}
              />
              <FilterSelect
                label="Impact"
                allLabel="All impact levels"
                value={criticality}
                options={CRITICALITIES.map((value) => ({
                  value,
                  label: CRITICALITY_PRESENTATION[value].label,
                }))}
                onChange={setCriticality}
              />
            </Toolbar>
            <Table
              data={visible}
              columns={
                canEdit
                  ? [
                      ...dependencyColumns,
                      editColumn<ApplicationDependency>(
                        (d) => paths.dependencies.edit(d.id),
                        () => 'dependency',
                      ),
                    ]
                  : dependencyColumns
              }
              getRowId={(row) => row.id}
              pagination={PAGINATION}
              emptyState={<EmptyState compact title="No dependencies match these filters" />}
            />
          </>
        );
      }}
    </QueryView>
  );
}

const integrationColumns: TableColumnDef<Integration>[] = [
  {
    id: 'name',
    header: 'Integration',
    width: 240,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <span>{row.original.name}</span>
        <span className="c-muted c-cell-stack__secondary">{row.original.dataExchanged}</span>
      </span>
    ),
  },
  {
    id: 'from',
    header: 'From',
    width: 200,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.fromApplicationId} />,
  },
  {
    id: 'to',
    header: 'To',
    width: 200,
    cell: ({ row }) =>
      row.original.toApplicationId ? (
        <ApplicationRefLink applicationId={row.original.toApplicationId} />
      ) : (
        <span className="c-cell-stack">
          <span>{row.original.externalPartyName}</span>
          <span className="c-muted c-cell-stack__secondary">External</span>
        </span>
      ),
  },
  {
    id: 'type',
    header: 'Type',
    width: 120,
    cell: ({ row }) => INTEGRATION_TYPE_LABELS[row.original.type],
  },
  {
    id: 'frequency',
    header: 'Frequency',
    width: 130,
    cell: ({ row }) => INTEGRATION_FREQUENCY_LABELS[row.original.frequency],
  },
];

export function IntegrationRegister() {
  const query = useAllIntegrations();
  const canEdit = usePermission('portfolio:edit');
  const [type, setType] = useParamFilter('itype', INTEGRATION_TYPES);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading integrations"
      errorTitle="Integrations could not be loaded"
    >
      {(all) => {
        const visible = all.filter((i) => !type || i.type === type);
        return (
          <>
            <Toolbar
              label="Filter integrations"
              add={
                <SmallCreateAction to={paths.integrations.create()} label="Record integration" />
              }
              end={
                <FilterSummary
                  summary={pluralize(visible.length, 'integration')}
                  activeFilterCount={type ? 1 : 0}
                  onReset={() => setType(null)}
                />
              }
            >
              <FilterSelect
                label="Type"
                allLabel="All types"
                value={type}
                options={INTEGRATION_TYPES.map((value) => ({
                  value,
                  label: INTEGRATION_TYPE_LABELS[value],
                }))}
                onChange={setType}
              />
            </Toolbar>
            <Table
              data={visible}
              columns={
                canEdit
                  ? [
                      ...integrationColumns,
                      editColumn<Integration>(
                        (i) => paths.integrations.edit(i.id),
                        (i) => i.name,
                      ),
                    ]
                  : integrationColumns
              }
              getRowId={(row) => row.id}
              pagination={PAGINATION}
              emptyState={<EmptyState compact title="No integrations match this filter" />}
            />
          </>
        );
      }}
    </QueryView>
  );
}
