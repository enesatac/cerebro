import type { ProjectRepository } from '@/domains/projects/api/ProjectRepository';
import {
  PROJECT_HEALTHS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type Project,
  type ProjectInput,
  type ProjectListItem,
  type ProjectListQuery,
  type ProjectSortField,
} from '@/domains/projects/types';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import { deleteProjectCascade, projectDeletionImpact } from './cascade';
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

export function toProjectListItem(project: Project, lookup: Lookup): ProjectListItem {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    health: project.health,
    priority: project.priority,
    currentPhase: project.currentPhase,
    progressPercentage: project.progressPercentage,
    businessUnit: lookup.businessUnit(project.businessUnitId),
    projectManager: lookup.person(findPrimaryRoleHolder(project.roles, 'project-manager')),
    plannedEndDate: project.timeline.plannedEndDate,
  };
}

const sortValueOf: Record<ProjectSortField, (item: ProjectListItem) => SortValue> = {
  name: (item) => item.name,
  code: (item) => item.code,
  status: (item) => PROJECT_STATUSES.indexOf(item.status),
  health: (item) => PROJECT_HEALTHS.indexOf(item.health),
  priority: (item) => PROJECT_PRIORITIES.indexOf(item.priority),
  plannedEndDate: (item) => item.plannedEndDate,
};

export class MockProjectRepository implements ProjectRepository {
  constructor(
    private readonly db: MockDatabase,
    private readonly lookup: Lookup,
    private readonly latencyMs: number,
    private readonly kit: WriteKit,
  ) {}

  private validate(input: ProjectInput, excludeId: string | null) {
    const { db, kit } = this;
    kit.assertUnique(
      db.projects,
      input.code,
      (p) => p.code,
      excludeId,
      `"${input.code}" kodu başka bir proje tarafından kullanılıyor.`,
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
      input.applicationImpacts.map((i) => i.applicationId),
      db.applications,
      'uygulama',
      'applicationImpacts',
    );
  }

  async create(input: ProjectInput) {
    const user = await this.kit.begin();
    this.validate(input, null);
    const project: Project = {
      ...copy(input),
      id: this.kit.uniqueId('prj', input.name, this.db.projects),
      audit: this.kit.newAudit(user),
    };
    this.db.projects.push(project);
    return copy(project);
  }

  async update(id: string, input: ProjectInput) {
    const user = await this.kit.begin();
    const current = findOrThrow(this.db.projects, id, 'Proje');
    this.validate(input, id);
    return copy(
      replaceRow(this.db.projects, {
        ...copy(input),
        id,
        audit: this.kit.touch(current.audit, user),
      }),
    );
  }

  async remove(id: string) {
    await this.kit.begin('portfolio:delete');
    findOrThrow(this.db.projects, id, 'Proje');
    deleteProjectCascade(this.db, id);
    removeRow(this.db.projects, id);
  }

  async getDeletionImpact(id: string) {
    await delay(this.latencyMs);
    findOrThrow(this.db.projects, id, 'Proje');
    return projectDeletionImpact(this.db, id);
  }

  async list(query: ProjectListQuery) {
    await delay(this.latencyMs);
    const sort = query.sort ?? { field: 'name', direction: 'asc' };
    const rows = this.db.projects
      .filter(
        (p) =>
          matchesSearch(query.search, [p.name, p.code, p.shortName, p.description, ...p.tags]) &&
          (!query.statuses?.length || query.statuses.includes(p.status)) &&
          (!query.healths?.length || query.healths.includes(p.health)) &&
          (!query.businessUnitId || p.businessUnitId === query.businessUnitId) &&
          (!query.teamId || p.teams.some((t) => t.teamId === query.teamId)),
      )
      .map((p) => toProjectListItem(p, this.lookup))
      .sort((a, b) =>
        compareValues(sortValueOf[sort.field](a), sortValueOf[sort.field](b), sort.direction),
      );
    return copy(paginate(rows, query.page, query.pageSize));
  }

  async getById(id: string) {
    await delay(this.latencyMs);
    return copy(findOrThrow(this.db.projects, id, 'Proje'));
  }

  async listRefs() {
    await delay(this.latencyMs);
    return this.db.projects.map(({ id, name, code }) => ({ id, name, code }));
  }

  async listByApplication(applicationId: string) {
    await delay(this.latencyMs);
    return copy(
      this.db.projects.flatMap((project) =>
        project.applicationImpacts
          .filter((impact) => impact.applicationId === applicationId)
          .map((impact) => ({ project: toProjectListItem(project, this.lookup), impact })),
      ),
    );
  }
}
