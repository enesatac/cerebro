import type { SearchRepository } from '@/domains/search/api/SearchRepository';
import type { Privilege } from '@/domains/auth/types';
import { hasPrivilege } from '@/domains/auth/utils/permissions';
import type { SearchQuery, SearchResult, SearchableKind } from '@/domains/search/types';
import type { MockDatabase } from './database';
import type { MockAuthority } from './session';
import { delay, matchesSearch } from './query';

const DEFAULT_LIMIT = 20;

/** Results only come from screens the user may view. */
const KIND_PRIVILEGE: Record<SearchableKind, Privilege> = {
  application: 'applications:view',
  project: 'projects:view',
  team: 'teams:view',
  person: 'people:view',
  technology: 'technologies:view',
};

export class MockSearchRepository implements SearchRepository {
  constructor(
    private readonly db: MockDatabase,
    private readonly latencyMs: number,
    private readonly authority: MockAuthority,
  ) {}

  async search({ term, kinds, limit = DEFAULT_LIMIT }: SearchQuery): Promise<SearchResult[]> {
    await delay(this.latencyMs);
    if (!term.trim()) return [];
    const user = this.authority.currentUser();
    const wants = (kind: SearchResult['kind']) =>
      (!kinds?.length || kinds.includes(kind)) && hasPrivilege(user, KIND_PRIVILEGE[kind]);
    const results: SearchResult[] = [];

    if (wants('application')) {
      for (const a of this.db.applications) {
        if (matchesSearch(term, [a.name, a.code, a.shortDescription, ...a.tags])) {
          results.push({
            kind: 'application',
            id: a.id,
            title: a.name,
            subtitle: a.code,
            description: a.shortDescription,
          });
        }
      }
    }
    if (wants('project')) {
      for (const p of this.db.projects) {
        if (matchesSearch(term, [p.name, p.code, p.shortName, p.description, ...p.tags])) {
          results.push({
            kind: 'project',
            id: p.id,
            title: p.name,
            subtitle: p.code,
            description: p.description,
          });
        }
      }
    }
    if (wants('team')) {
      for (const t of this.db.teams) {
        if (matchesSearch(term, [t.name, t.description])) {
          results.push({
            kind: 'team',
            id: t.id,
            title: t.name,
            subtitle: 'Ekip',
            description: t.description,
          });
        }
      }
    }
    if (wants('person')) {
      for (const p of this.db.people) {
        if (matchesSearch(term, [p.fullName, p.jobTitle])) {
          results.push({ kind: 'person', id: p.id, title: p.fullName, subtitle: p.jobTitle });
        }
      }
    }
    if (wants('technology')) {
      for (const t of this.db.technologies) {
        if (matchesSearch(term, [t.name])) {
          results.push({
            kind: 'technology',
            id: t.id,
            title: t.name,
            subtitle: t.category,
            description: t.description,
          });
        }
      }
    }
    return results.slice(0, limit);
  }
}
