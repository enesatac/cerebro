import { Button } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
import { pluralize } from '@/lib/format';
import { useProjectList } from '../api/queries';
import { ProjectFilters } from '../components/ProjectFilters';
import { ProjectsTable } from '../components/ProjectsTable';
import {
  DEFAULT_PROJECT_LIST_STATE,
  countActiveProjectFilters,
  parseProjectListParams,
  serializeProjectListParams,
  toProjectListQuery,
  type ProjectListState,
} from '../utils/projectListParams';
import { CreateAction } from '@/domains/auth/components/RecordActions';
import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { useTeamsById } from '@/domains/teams/api/queries';
import { describeFilters } from '@/lib/xlsxTypes';
import { projectSheet } from '../utils/projectExport';
import { useRepositories } from '@/services/RepositoryContext';

export default function ProjectsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseProjectListParams(searchParams);
  const query = useProjectList(toProjectListQuery(state));

  const update = (next: ProjectListState) =>
    setSearchParams(serializeProjectListParams(next), { replace: true });
  const updateFilters = (patch: Partial<ProjectListState>) =>
    update({ ...state, ...patch, page: 0 });
  const resetFilters = () =>
    update({ ...DEFAULT_PROJECT_LIST_STATE, sort: state.sort, pageSize: state.pageSize });

  const total = query.data?.total;

  const { projects } = useRepositories();
  const masterData = useMasterData();
  const teams = useTeamsById();
  const units = useBusinessUnitsById();
  // Every matching project, not just the visible page.
  const exportSheets = async () => {
    const all = await projects.list({
      ...toProjectListQuery(state),
      page: 0,
      pageSize: Math.max(total ?? 0, 1000),
    });
    return [
      projectSheet(all.items, masterData, {
        title: 'Projeler',
        subtitle: describeFilters([
          ['Arama', state.search],
          ['Durum', state.status && masterData.label('projectStatuses', state.status)],
          ['Sağlık', state.health && masterData.label('projectHealths', state.health)],
          ['İş birimi', state.businessUnitId ? units.data?.get(state.businessUnitId)?.name : null],
          ['Ekip', state.teamId ? teams.data?.get(state.teamId)?.name : null],
        ]),
      }),
    ];
  };

  return (
    <>
      <PageHeader
        title="Projeler"
        subtitle="Süren değişiklikler: durum, sağlık, zaman çizelgesi ve her projenin etkilediği uygulamalar."
        actions={
          <>
            <ExcelExportButton title="Projeler" build={exportSheets} disabled={!total} />
            <CreateAction to={paths.projects.create()} label="Proje oluştur" />
          </>
        }
      />
      <ProjectFilters
        state={state}
        onChange={updateFilters}
        onReset={resetFilters}
        resultSummary={total === undefined ? '' : pluralize(total, 'proje')}
      />
      {query.isError ? (
        <ErrorState title="Projeler yüklenemedi" onRetry={() => void query.refetch()} />
      ) : (
        <ProjectsTable
          result={query.data}
          sort={state.sort}
          loading={query.isFetching}
          onSortChange={(sort) =>
            update({ ...state, sort: sort ?? DEFAULT_PROJECT_LIST_STATE.sort, page: 0 })
          }
          onPageChange={(page, pageSize) =>
            update({ ...state, page: pageSize === state.pageSize ? page : 0, pageSize })
          }
          emptyState={
            query.isPending ? null : countActiveProjectFilters(state) > 0 ? (
              <EmptyState
                compact
                title="Bu filtrelere uyan proje yok"
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
                title="Henüz kayıtlı proje yok"
                description="Projeler Cerebro'ya eklendikçe burada görünür."
              />
            )
          }
        />
      )}
    </>
  );
}
