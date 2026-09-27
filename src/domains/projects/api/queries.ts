import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApplicationId } from '@/domains/applications/types';
import { useRepositories } from '@/services/RepositoryContext';
import type { ProjectId, ProjectListQuery } from '../types';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (query: ProjectListQuery) => [...projectKeys.lists(), query] as const,
  detail: (id: ProjectId) => [...projectKeys.all, 'detail', id] as const,
  refs: () => [...projectKeys.all, 'refs'] as const,
  byApplication: (applicationId: ApplicationId) =>
    [...projectKeys.all, 'by-application', applicationId] as const,
};

export function useProjectList(query: ProjectListQuery) {
  const { projects } = useRepositories();
  return useQuery({
    queryKey: projectKeys.list(query),
    queryFn: () => projects.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: ProjectId) {
  const { projects } = useRepositories();
  return useQuery({ queryKey: projectKeys.detail(id), queryFn: () => projects.getById(id) });
}

/** id → `{ name, code }` for every project. */
export function useProjectRefs() {
  const { projects } = useRepositories();
  return useQuery({
    queryKey: projectKeys.refs(),
    queryFn: () => projects.listRefs(),
    select: (refs) => new Map(refs.map((ref) => [ref.id, ref])),
  });
}

export function useProjectsByApplication(applicationId: ApplicationId) {
  const { projects } = useRepositories();
  return useQuery({
    queryKey: projectKeys.byApplication(applicationId),
    queryFn: () => projects.listByApplication(applicationId),
  });
}

export function useProjectOptions() {
  const refs = useProjectRefs();
  return [...(refs.data?.values() ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ref) => ({ value: String(ref.id), label: `${ref.name} (${ref.code})` }));
}
