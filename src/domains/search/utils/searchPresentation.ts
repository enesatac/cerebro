import { paths } from '@/app/router/paths';
import type { SearchableKind, SearchResult } from '../types';

export const SEARCHABLE_KIND_LABELS: Record<SearchableKind, string> = {
  application: 'Uygulamalar',
  project: 'Projeler',
  team: 'Ekipler',
  person: 'Kişiler',
  technology: 'Teknolojiler',
};

/** Kinds with a detail page link; people have no page yet and display as text. */
export function searchResultHref(result: SearchResult): string | null {
  switch (result.kind) {
    case 'application':
      return paths.applications.detail(result.id);
    case 'project':
      return paths.projects.detail(result.id);
    case 'team':
      return paths.teams.detail(result.id);
    case 'technology':
      return paths.technologies.detail(result.id);
    default:
      return null;
  }
}
