import { Button } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
import { pluralize } from '@/lib/format';
import { useApplicationList } from '../api/queries';
import { ApplicationFilters } from '../components/ApplicationFilters';
import { ApplicationsTable } from '../components/ApplicationsTable';
import {
  DEFAULT_APPLICATION_LIST_STATE,
  countActiveFilters,
  parseApplicationListParams,
  serializeApplicationListParams,
  toApplicationListQuery,
  type ApplicationListState,
} from '../utils/applicationListParams';
import { CreateAction } from '@/domains/auth/components/RecordActions';
import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { useTeamsById } from '@/domains/teams/api/queries';
import { useTechnologiesById } from '@/domains/technologies/api/queries';
import { describeFilters } from '@/lib/xlsxTypes';
import { applicationSheet } from '../utils/applicationExport';
import { useRepositories } from '@/services/RepositoryContext';

export default function ApplicationsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseApplicationListParams(searchParams);
  const query = useApplicationList(toApplicationListQuery(state));

  const update = (next: ApplicationListState) =>
    setSearchParams(serializeApplicationListParams(next), { replace: true });
  // Any filter change returns to the first page.
  const updateFilters = (patch: Partial<ApplicationListState>) =>
    update({ ...state, ...patch, page: 0 });
  const resetFilters = () =>
    update({ ...DEFAULT_APPLICATION_LIST_STATE, sort: state.sort, pageSize: state.pageSize });

  const hasFilters = countActiveFilters(state) > 0;
  const total = query.data?.total;

  const { applications } = useRepositories();
  const masterData = useMasterData();
  const teams = useTeamsById();
  const units = useBusinessUnitsById();
  const technologies = useTechnologiesById();
  // Every matching application, not just the visible page.
  const exportSheets = async () => {
    const all = await applications.list({
      ...toApplicationListQuery(state),
      page: 0,
      pageSize: Math.max(total ?? 0, 1000),
    });
    return [
      applicationSheet(all.items, masterData, {
        title: 'Uygulamalar',
        subtitle: describeFilters([
          ['Arama', state.search],
          [
            'Yaşam döngüsü',
            state.lifecycle && masterData.label('applicationLifecycles', state.lifecycle),
          ],
          ['Kritiklik', state.criticality && masterData.label('criticalities', state.criticality)],
          ['Ekip', state.teamId ? teams.data?.get(state.teamId)?.name : null],
          [
            'Teknoloji',
            state.technologyId ? technologies.data?.get(state.technologyId)?.name : null,
          ],
          ['İş birimi', state.businessUnitId ? units.data?.get(state.businessUnitId)?.name : null],
        ]),
      }),
    ];
  };

  return (
    <>
      <PageHeader
        title="Uygulamalar"
        subtitle="Portföydeki tüm uygulamalar: ne yaptıkları, sahiplerinin kim olduğu ve ne kadar kritik oldukları."
        actions={
          <>
            <ExcelExportButton title="Uygulamalar" build={exportSheets} disabled={!total} />
            <CreateAction
              to={paths.applications.create()}
              label="Uygulama kaydet"
              privilege="applications:edit"
            />
          </>
        }
      />
      <ApplicationFilters
        state={state}
        onChange={updateFilters}
        onReset={resetFilters}
        resultSummary={total === undefined ? '' : pluralize(total, 'uygulama')}
      />
      {query.isError ? (
        <ErrorState title="Uygulamalar yüklenemedi" onRetry={() => void query.refetch()} />
      ) : (
        <ApplicationsTable
          result={query.data}
          sort={state.sort}
          loading={query.isFetching}
          onSortChange={(sort) =>
            update({ ...state, sort: sort ?? DEFAULT_APPLICATION_LIST_STATE.sort, page: 0 })
          }
          onPageChange={(page, pageSize) =>
            update({ ...state, page: pageSize === state.pageSize ? page : 0, pageSize })
          }
          emptyState={
            query.isPending ? null : hasFilters ? (
              <EmptyState
                compact
                title="Bu filtrelere uyan uygulama yok"
                description="Daha geniş bir arama yapın veya bir filtreyi kaldırın."
                action={
                  <Button
                    size="small"
                    appearance="outlined"
                    variant="neutral"
                    onClick={resetFilters}
                  >
                    Filtreleri temizle
                  </Button>
                }
              />
            ) : (
              <EmptyState
                compact
                title="Henüz kayıtlı uygulama yok"
                description="Uygulamalar Cerebro'ya eklendikçe burada görünür."
              />
            )
          }
        />
      )}
    </>
  );
}
