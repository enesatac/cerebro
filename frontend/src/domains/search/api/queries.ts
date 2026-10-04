import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { SearchQuery } from '../types';

export const searchKeys = {
  all: ['search'] as const,
  query: (query: SearchQuery) => [...searchKeys.all, query] as const,
};

export function useSearch(query: SearchQuery) {
  const { search } = useRepositories();
  return useQuery({
    queryKey: searchKeys.query(query),
    queryFn: () => search.search(query),
    enabled: query.term.trim().length > 0,
  });
}
