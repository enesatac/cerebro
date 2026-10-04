import type { EntityId } from '@/domains/shared/types';

/** Entity kinds global search can return. Extend as modules gain search support. */
export const SEARCHABLE_KINDS = ['application', 'project', 'team', 'person', 'technology'] as const;
export type SearchableKind = (typeof SEARCHABLE_KINDS)[number];

export interface SearchResult {
  kind: SearchableKind;
  id: EntityId;
  title: string;
  /** Secondary identifying text: code, job title, category… */
  subtitle: string;
  /** Short context shown under the title. */
  description?: string;
}

export interface SearchQuery {
  term: string;
  kinds?: SearchableKind[];
  limit?: number;
}
