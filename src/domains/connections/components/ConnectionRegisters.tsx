import { loadPortfolioNames } from '@/domains/shared/utils/portfolioNames';
import { useRepositories } from '@/services/RepositoryContext';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { describeFilters, sheet } from '@/lib/xlsxTypes';
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
import { usePrivilege } from '@/domains/auth/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useMasterData } from '@/domains/master-data/context';
import { DependencyDeleteAction } from './DependencyDeleteAction';
import { IntegrationDeleteAction } from './IntegrationDeleteAction';

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
  const canEdit = usePrivilege('connections:edit');
  const [type, setType] = useParamFilter('type', codesOf(masterData.items('dependencyTypes')));
  const [criticality, setCriticality] = useParamFilter('criticality', CRITICALITIES);
  const repositories = useRepositories();
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
              add={
                <SmallCreateAction
                  to={paths.dependencies.create()}
                  label="Bağımlılık kaydet"
                  privilege="connections:edit"
                />
              }
              end={
                <>
                  <FilterSummary
                    summary={pluralize(visible.length, 'bağımlılık')}
                    activeFilterCount={[type, criticality].filter(Boolean).length}
                    onReset={() => {
                      setType(null);
                      setCriticality(null);
                    }}
                  />
                  <ExcelExportButton
                    title="Bağımlılıklar"
                    disabled={visible.length === 0}
                    build={async () => {
                      const names = await loadPortfolioNames(repositories);
                      const appName = names.application;
                      return [
                        sheet<ApplicationDependency>({
                          name: 'Bağımlılıklar',
                          title: 'Bağımlılıklar',
                          subtitle: describeFilters([
                            ['Tür', type && masterData.label('dependencyTypes', type)],
                            ['Etki', criticality && masterData.label('criticalities', criticality)],
                          ]),
                          rows: visible,
                          columns: [
                            { header: 'Uygulama', value: (d) => appName(d.sourceApplicationId) },
                            {
                              header: 'Bağımlı olduğu',
                              value: (d) => appName(d.targetApplicationId),
                            },
                            {
                              header: 'Tür',
                              value: (d) => masterData.label('dependencyTypes', d.type),
                            },
                            {
                              header: 'Erişilemezse etkisi',
                              value: (d) => masterData.label('criticalities', d.criticality),
                            },
                            { header: 'Açıklama', value: (d) => d.description, width: 50 },
                          ],
                        }),
                      ];
                    }}
                  />
                </>
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
                        () => 'bağımlılık',
                        (d) => <DependencyDeleteAction record={d} compact />,
                      ),
                    ]
                  : dependencyColumns
              }
              getRowId={(row) => String(row.id)}
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
  const canEdit = usePrivilege('connections:edit');
  const [type, setType] = useParamFilter('itype', codesOf(masterData.items('integrationTypes')));
  const repositories = useRepositories();
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
                <SmallCreateAction
                  to={paths.integrations.create()}
                  label="Entegrasyon kaydet"
                  privilege="connections:edit"
                />
              }
              end={
                <>
                  <FilterSummary
                    summary={pluralize(visible.length, 'entegrasyon')}
                    activeFilterCount={type ? 1 : 0}
                    onReset={() => setType(null)}
                  />
                  <ExcelExportButton
                    title="Entegrasyonlar"
                    disabled={visible.length === 0}
                    build={async () => {
                      const names = await loadPortfolioNames(repositories);
                      const appName = names.application;
                      return [
                        sheet<Integration>({
                          name: 'Entegrasyonlar',
                          title: 'Entegrasyonlar',
                          subtitle: describeFilters([
                            ['Tür', type && masterData.label('integrationTypes', type)],
                          ]),
                          rows: visible,
                          columns: [
                            { header: 'Entegrasyon', value: (i) => i.name },
                            { header: 'Kaynak', value: (i) => appName(i.fromApplicationId) },
                            {
                              header: 'Hedef',
                              value: (i) =>
                                i.toApplicationId
                                  ? appName(i.toApplicationId)
                                  : `${i.externalPartyName ?? ''} (harici)`,
                            },
                            {
                              header: 'Tür',
                              value: (i) => masterData.label('integrationTypes', i.type),
                            },
                            {
                              header: 'Sıklık',
                              value: (i) => masterData.label('integrationFrequencies', i.frequency),
                            },
                            { header: 'Aktarılan veri', value: (i) => i.dataExchanged, width: 40 },
                            { header: 'Açıklama', value: (i) => i.description, width: 50 },
                          ],
                        }),
                      ];
                    }}
                  />
                </>
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
                        (i) => <IntegrationDeleteAction record={i} compact />,
                      ),
                    ]
                  : integrationColumns
              }
              getRowId={(row) => String(row.id)}
              pagination={PAGINATION}
              emptyState={<EmptyState compact title="Bu filtreye uyan entegrasyon yok" />}
            />
          </>
        );
      }}
    </QueryView>
  );
}
