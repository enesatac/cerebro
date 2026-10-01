import { isActiveEscalation } from '@/domains/escalations/utils/escalationPresentation';
import type { PersonGovernanceItem, PersonWorkItem, PersonWorkload } from '@/domains/people/types';
import type {
  EntityId,
  EntityRef,
  IsoDate,
  RoleAssignment,
  TeamAssignment,
} from '@/domains/shared/types';
import { isActiveRisk } from '@/domains/risks/utils/riskPresentation';
import type { MockDatabase } from './database';
import type { Lookup } from './lookup';
import { copy, findOrThrow } from './query';

const isRef = (ref: EntityRef | null): ref is EntityRef => ref !== null;
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'tr');

interface PortfolioRow {
  id: EntityId;
  code: string;
  name: string;
  roles: RoleAssignment[];
  teams: TeamAssignment[];
}

/** The joins behind `PersonRepository.getWorkload`. */
export function buildPersonWorkload(
  db: MockDatabase,
  lookup: Lookup,
  personId: EntityId,
  today: IsoDate,
): PersonWorkload {
  const person = findOrThrow(db.people, personId, 'Kişi');
  const teams = db.teams
    .filter((t) => t.managerId === personId || t.memberIds.includes(personId))
    .map((t) => ({
      team: { id: t.id, name: t.name },
      manager: t.managerId === personId,
      member: t.memberIds.includes(personId),
    }))
    .sort((a, b) => byName(a.team, b.team));
  const teamIds = new Set(teams.map((t) => t.team.id));

  const workItem = <T extends PortfolioRow>(
    row: T,
    status: string,
    criticality: string,
  ): PersonWorkItem | null => {
    const roles = row.roles.filter((r) => r.personId === personId).map((r) => r.role);
    const viaTeams = row.teams
      .filter((a) => teamIds.has(a.teamId))
      .map((a) => ({ team: lookup.team(a.teamId), responsibility: a.responsibility }))
      .filter((a): a is { team: EntityRef; responsibility: string } => a.team !== null);
    if (roles.length === 0 && viaTeams.length === 0) return null;
    return { id: row.id, code: row.code, name: row.name, status, criticality, roles, viaTeams };
  };
  // Direct roles first, then team work; alphabetical within each.
  const ordered = (items: (PersonWorkItem | null)[]) =>
    items
      .filter((item): item is PersonWorkItem => item !== null)
      .sort((a, b) => Number(b.roles.length > 0) - Number(a.roles.length > 0) || byName(a, b));

  const applicationRef = (id: EntityId) => {
    const row = db.applications.find((a) => a.id === id);
    return row ? { id, name: row.name } : null;
  };
  const projectRef = (id: EntityId) => {
    const row = db.projects.find((p) => p.id === id);
    return row ? { id, name: row.name } : null;
  };
  const related = (r: { relatedApplicationIds: EntityId[]; relatedProjectIds: EntityId[] }) => ({
    applications: r.relatedApplicationIds.map(applicationRef).filter(isRef),
    projects: r.relatedProjectIds.map(projectRef).filter(isRef),
  });
  const governance = (items: PersonGovernanceItem[]) =>
    items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return copy({
    person,
    businessUnit: lookup.businessUnit(person.businessUnitId),
    teams,
    headOf: db.businessUnits
      .filter((b) => b.headId === personId)
      .map((b) => ({ id: b.id, name: b.name }))
      .sort(byName),
    applications: ordered(db.applications.map((a) => workItem(a, a.lifecycle, a.criticality))),
    projects: ordered(db.projects.map((p) => workItem(p, p.status, p.priority))),
    risks: governance(
      db.risks
        .filter((r) => r.ownerId === personId)
        .map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          active: isActiveRisk(r.status),
          severity: r.severity,
          date: r.dueDate,
          involvement: ['owner'],
          ...related(r),
        })),
    ),
    escalations: governance(
      db.escalations
        .filter((e) => e.ownerId === personId || e.raisedById === personId)
        .map((e) => ({
          id: e.id,
          title: e.title,
          status: e.status,
          active: isActiveEscalation(e.status),
          severity: e.severity,
          date: e.targetResolutionDate,
          involvement: [
            ...(e.ownerId === personId ? (['owner'] as const) : []),
            ...(e.raisedById === personId ? (['raised'] as const) : []),
          ],
          ...related(e),
        })),
    ),
    decisions: governance(
      db.decisions
        .filter((d) => d.decidedByIds.includes(personId))
        .map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          active: false,
          severity: null,
          date: d.decisionDate,
          involvement: ['decider'],
          ...related(d),
        })),
    ),
    leaves: db.leaves
      .filter((l) => l.personId === personId && l.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map(({ id, type, startDate, endDate }) => ({ id, type, startDate, endDate })),
  });
}
