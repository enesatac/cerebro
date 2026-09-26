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

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Change in flight: status, health, timeline and which applications each project affects."
        actions={<CreateAction to={paths.projects.create()} label="Create project" />}
      />
      <ProjectFilters
        state={state}
        onChange={updateFilters}
        onReset={resetFilters}
        resultSummary={total === undefined ? '' : pluralize(total, 'project')}
      />
      {query.isError ? (
        <ErrorState title="Projects could not be loaded" onRetry={() => void query.refetch()} />
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
                title="No projects match these filters"
                description="Try a broader search or remove a filter."
                action={
                  <Button
                    size="small"
                    appearance="outlined"
                    variant="neutral"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                compact
                title="No projects have been registered yet"
                description="Projects appear here once they are added to Cerebro."
              />
            )
          }
        />
      )}
    </>
  );
}
