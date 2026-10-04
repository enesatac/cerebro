import type { SearchQuery, SearchResult } from '../types';

export interface SearchRepository {
  search(query: SearchQuery): Promise<SearchResult[]>;
}
