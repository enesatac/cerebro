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

  return (
    <>
      <PageHeader
        title="Uygulamalar"
        subtitle="Portföydeki tüm uygulamalar: ne yaptıkları, sahiplerinin kim olduğu ve ne kadar kritik oldukları."
        actions={<CreateAction to={paths.applications.create()} label="Uygulama kaydet" />}
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
