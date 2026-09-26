import type { ApplicationRepository } from '@/domains/applications/api/ApplicationRepository';
import {
  APPLICATION_LIFECYCLES,
  type Application,
  type ApplicationInput,
  type ApplicationListItem,
  type ApplicationListQuery,
  type ApplicationSortField,
} from '@/domains/applications/types';
import { CRITICALITIES } from '@/domains/shared/types';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import { applicationDeletionImpact, deleteApplicationCascade } from './cascade';
import type { MockDatabase } from './database';
import type { Lookup } from './lookup';
import {
  compareValues,
  copy,
  delay,
  findOrThrow,
  matchesSearch,
  paginate,
  type SortValue,
} from './query';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

export function toApplicationListItem(
  application: Application,
  lookup: Lookup,
): ApplicationListItem {
  return {
    id: application.id,
    code: application.code,
    name: application.name,
    shortDescription: application.shortDescription,
    lifecycle: application.lifecycle,
    criticality: application.criticality,
    operationalStatus: application.operationalStatus,
    businessUnit: lookup.businessUnit(application.businessUnitId),
    technicalOwner: lookup.person(findPrimaryRoleHolder(application.roles, 'technical-owner')),
    teams: application.teams.flatMap((assignment) => {
      const ref = lookup.team(assignment.teamId);
      return ref ? [{ ...ref, responsibility: assignment.responsibility }] : [];
    }),
    updatedAt: application.audit.updatedAt,
  };
}

export function matchesApplicationFilters(
  application: Application,
  query: ApplicationListQuery,
): boolean {
  if (
    !matchesSearch(query.search, [
      application.name,
      application.code,
      application.shortDescription,
      ...application.tags,
    ])
  ) {
    return false;
  }
  if (query.lifecycles?.length && !query.lifecycles.includes(application.lifecycle)) return false;
  if (query.criticalities?.length && !query.criticalities.includes(application.criticality))
    return false;
  if (query.businessUnitId && application.businessUnitId !== query.businessUnitId) return false;
  if (query.teamId && !application.teams.some((t) => t.teamId === query.teamId)) return false;
  if (
    query.technologyId &&
    !application.technologies.some((t) => t.technologyId === query.technologyId)
  ) {
    return false;
  }
  return true;
}

/** Enumerations sort by their business order (planned → retired, low → critical), not alphabetically. */
const sortValueOf: Record<ApplicationSortField, (item: ApplicationListItem) => SortValue> = {
  name: (item) => item.name,
  code: (item) => item.code,
  lifecycle: (item) => APPLICATION_LIFECYCLES.indexOf(item.lifecycle),
  criticality: (item) => CRITICALITIES.indexOf(item.criticality),
  businessUnit: (item) => item.businessUnit?.name ?? null,
  technicalOwner: (item) => item.technicalOwner?.name ?? null,
  updatedAt: (item) => item.updatedAt,
};

export class MockApplicationRepository implements ApplicationRepository {
  constructor(
    private readonly db: MockDatabase,
    private readonly lookup: Lookup,
    private readonly latencyMs: number,
    private readonly kit: WriteKit,
  ) {}

  /** Server-side validation: unique code and every referenced id must exist. */
  private validate(input: ApplicationInput, excludeId: string | null) {
    const { db, kit } = this;
    kit.assertUnique(
      db.applications,
      input.code,
      (a) => a.code,
      excludeId,
      `"${input.code}" kodu başka bir uygulama tarafından kullanılıyor.`,
      'code',
    );
    kit.assertRefs([input.businessUnitId], db.businessUnits, 'iş birimi', 'businessUnitId');
    kit.assertRefs(
      input.roles.map((r) => r.personId),
      db.people,
      'kişi',
      'roles',
    );
    kit.assertRefs(
      input.teams.map((t) => t.teamId),
      db.teams,
      'ekip',
      'teams',
    );
    kit.assertRefs(
      [
        ...input.technologies.map((t) => t.technologyId),
        ...input.dataStores.map((d) => d.technologyId),
      ],
      db.technologies,
      'teknoloji',
      'technologies',
    );
  }

  async create(input: ApplicationInput) {
    const user = await this.kit.begin();
    this.validate(input, null);
    const application: Application = {
      ...copy(input),
      id: this.kit.uniqueId('app', input.name, this.db.applications),
      audit: this.kit.newAudit(user),
    };
    this.db.applications.push(application);
    return copy(application);
  }

  async update(id: string, input: ApplicationInput) {
    const user = await this.kit.begin();
    const current = findOrThrow(this.db.applications, id, 'Uygulama');
    this.validate(input, id);
    return copy(
      replaceRow(this.db.applications, {
        ...copy(input),
        id,
        audit: this.kit.touch(current.audit, user),
      }),
    );
  }

  async remove(id: string) {
    await this.kit.begin('portfolio:delete');
    findOrThrow(this.db.applications, id, 'Uygulama');
    deleteApplicationCascade(this.db, id);
    removeRow(this.db.applications, id);
  }

  async getDeletionImpact(id: string) {
    await delay(this.latencyMs);
    findOrThrow(this.db.applications, id, 'Uygulama');
    return applicationDeletionImpact(this.db, id);
  }

  async list(query: ApplicationListQuery) {
    await delay(this.latencyMs);
    const sort = query.sort ?? { field: 'name', direction: 'asc' };
    const rows = this.db.applications
      .filter((application) => matchesApplicationFilters(application, query))
      .map((application) => toApplicationListItem(application, this.lookup))
      .sort(
        (a, b) =>
          compareValues(sortValueOf[sort.field](a), sortValueOf[sort.field](b), sort.direction) ||
          a.name.localeCompare(b.name),
      );
    return copy(paginate(rows, query.page, query.pageSize));
  }

  async getById(id: string) {
    await delay(this.latencyMs);
    return copy(findOrThrow(this.db.applications, id, 'Uygulama'));
  }

  async listRefs() {
    await delay(this.latencyMs);
    return this.db.applications.map(({ id, name, code }) => ({ id, name, code }));
  }
}
