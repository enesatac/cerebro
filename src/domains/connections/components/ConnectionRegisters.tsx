import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { ApplicationRefLink } from '@/domains/applications/components/ApplicationRefLink';
import { CRITICALITIES } from '@/domains/shared/types';
import { pluralize } from '@/lib/format';
import { oneOf } from '@/lib/urlParams';
import { useAllDependencies, useAllIntegrations } from '../api/queries';
import type { ApplicationDependency, Integration } from '../types';
import { paths } from '@/app/router/paths';
import { editColumn } from '@/components/data-display/editColumn';
import { usePermission } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useMasterData } from '@/domains/master-data/context';

const PAGINATION = { pageSize: 25, pageSizeOptions: [25, 50, 100] };

const codesOf = (items: readonly { code: string }[]) => items.map((item) => item.code);

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
    header: 'Uygulama',
    width: 220,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.sourceApplicationId} />,
  },
  {
    id: 'target',
    header: 'Bağımlı olduğu',
    width: 220,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.targetApplicationId} />,
  },
  {
    id: 'type',
    header: 'Tür',
    width: 130,
    cell: ({ row }) => <MasterLabel list="dependencyTypes" code={row.original.type} />,
  },
  {
    id: 'criticality',
    header: 'Erişilemezse etkisi',
    width: 150,
    cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.criticality} />,
  },
  { id: 'description', header: 'Açıklama', accessor: 'description' },
];

export function DependencyRegister() {
  const masterData = useMasterData();
  const query = useAllDependencies();
  const canEdit = usePermission('portfolio:edit');
  const [type, setType] = useParamFilter('type', codesOf(masterData.items('dependencyTypes')));
  const [criticality, setCriticality] = useParamFilter('criticality', CRITICALITIES);
  return (
    <QueryView
      query={query}
      loadingLabel="Bağımlılıklar yükleniyor"
      errorTitle="Bağımlılıklar yüklenemedi"
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
              label="Bağımlılıkları filtrele"
              add={<SmallCreateAction to={paths.dependencies.create()} label="Bağımlılık kaydet" />}
              end={
                <FilterSummary
                  summary={pluralize(visible.length, 'bağımlılık')}
                  activeFilterCount={[type, criticality].filter(Boolean).length}
                  onReset={() => {
                    setType(null);
                    setCriticality(null);
                  }}
                />
              }
            >
              <FilterSelect
                label="Tür"
                allLabel="Tüm türler"
                value={type}
                options={masterData.options('dependencyTypes', type)}
                onChange={setType}
              />
              <FilterSelect
                label="Etki"
                allLabel="Tüm etki düzeyleri"
                value={criticality}
                options={masterData.options('criticalities', criticality)}
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
              emptyState={<EmptyState compact title="Bu filtrelere uyan bağımlılık yok" />}
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
    header: 'Entegrasyon',
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
    header: 'Kaynak',
    width: 200,
    cell: ({ row }) => <ApplicationRefLink applicationId={row.original.fromApplicationId} />,
  },
  {
    id: 'to',
    header: 'Hedef',
    width: 200,
    cell: ({ row }) =>
      row.original.toApplicationId ? (
        <ApplicationRefLink applicationId={row.original.toApplicationId} />
      ) : (
        <span className="c-cell-stack">
          <span>{row.original.externalPartyName}</span>
          <span className="c-muted c-cell-stack__secondary">Harici</span>
        </span>
      ),
  },
  {
    id: 'type',
    header: 'Tür',
    width: 120,
    cell: ({ row }) => <MasterLabel list="integrationTypes" code={row.original.type} />,
  },
  {
    id: 'frequency',
    header: 'Sıklık',
    width: 130,
    cell: ({ row }) => <MasterLabel list="integrationFrequencies" code={row.original.frequency} />,
  },
];

export function IntegrationRegister() {
  const masterData = useMasterData();
  const query = useAllIntegrations();
  const canEdit = usePermission('portfolio:edit');
  const [type, setType] = useParamFilter('itype', codesOf(masterData.items('integrationTypes')));
  return (
    <QueryView
      query={query}
      loadingLabel="Entegrasyonlar yükleniyor"
      errorTitle="Entegrasyonlar yüklenemedi"
    >
      {(all) => {
        const visible = all.filter((i) => !type || i.type === type);
        return (
          <>
            <Toolbar
              label="Entegrasyonları filtrele"
              add={
                <SmallCreateAction to={paths.integrations.create()} label="Entegrasyon kaydet" />
              }
              end={
                <FilterSummary
                  summary={pluralize(visible.length, 'entegrasyon')}
                  activeFilterCount={type ? 1 : 0}
                  onReset={() => setType(null)}
                />
              }
            >
              <FilterSelect
                label="Tür"
                allLabel="Tüm türler"
                value={type}
                options={masterData.options('integrationTypes', type)}
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
              emptyState={<EmptyState compact title="Bu filtreye uyan entegrasyon yok" />}
            />
          </>
        );
      }}
    </QueryView>
  );
}
