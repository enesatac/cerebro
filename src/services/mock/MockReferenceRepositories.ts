import type { BusinessUnitRepository } from '@/domains/business-units/api/BusinessUnitRepository';
import type { GovernanceRepository } from '@/domains/governance/api/GovernanceRepository';
import {
  buildApplicationHealthReport,
  buildPortfolioOverview,
} from '@/domains/governance/utils/portfolio';
import type { PersonRepository } from '@/domains/people/api/PersonRepository';
import type { TeamRepository } from '@/domains/teams/api/TeamRepository';
import type { Team } from '@/domains/teams/types';
import type { TechnologyRepository } from '@/domains/technologies/api/TechnologyRepository';
import { ValidationError } from '@/lib/errors';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import { deleteTeamCascade, teamDeletionImpact, technologyDeletionImpact } from './cascade';
import type { MockDatabase } from './database';
import type { Lookup } from './lookup';
import { copy, delay, findOrThrow } from './query';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

/** People, business units, teams, technologies and portfolio aggregates. */
export function createMockReferenceRepositories(
  db: MockDatabase,
  lookup: Lookup,
  latencyMs: number,
  kit: WriteKit,
) {
  const wait = () => delay(latencyMs);

  const people: PersonRepository = {
    list: async () => (await wait(), copy(db.people)),
    getById: async (id) => (await wait(), copy(findOrThrow(db.people, id, 'Person'))),
  };

  const businessUnits: BusinessUnitRepository = {
    list: async () => (await wait(), copy(db.businessUnits)),
  };

  const teams: TeamRepository = {
    list: async () => (await wait(), copy(db.teams)),
    getById: async (id) => (await wait(), copy(findOrThrow(db.teams, id, 'Team'))),
    async listSummaries() {
      await wait();
      return db.teams
        .map((team) => ({
          id: team.id,
          name: team.name,
          description: team.description,
          manager: lookup.person(team.managerId),
          memberCount: team.memberIds.length,
          applicationCount: db.applications.filter((app) =>
            app.teams.some((a) => a.teamId === team.id),
          ).length,
          projectCount: db.projects.filter((project) =>
            project.teams.some((a) => a.teamId === team.id),
          ).length,
          contactEmail: team.contactEmail,
          chatChannel: team.chatChannel,
        }))
        .sort(byName);
    },
    ...createAuditedWriteRepository<Team, Omit<Team, 'id' | 'audit'>>({
      kit,
      latencyMs,
      rows: () => db.teams,
      entityLabel: 'Team',
      idPrefix: 'team',
      nameOf: (input) => input.name,
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input, excludeId) {
        kit.assertUnique(
          db.teams,
          input.name,
          (t) => t.name,
          excludeId,
          `A team named "${input.name}" already exists.`,
          'name',
        );
        kit.assertRefs([input.managerId, ...input.memberIds], db.people, 'person', 'memberIds');
      },
      impact: (id) => teamDeletionImpact(db, id),
      cascade: (id) => deleteTeamCascade(db, id),
    }),
  };

  const technologies: TechnologyRepository = {
    list: async () => (await wait(), copy(db.technologies)),
    getById: async (id) => (await wait(), copy(findOrThrow(db.technologies, id, 'Technology'))),
    async listSummaries() {
      await wait();
      return db.technologies
        .map((technology) => {
          const users = db.applications.filter((app) =>
            app.technologies.some((u) => u.technologyId === technology.id),
          );
          return {
            ...copy(technology),
            applicationCount: users.length,
            activeApplicationCount: users.filter((app) => app.lifecycle !== 'retired').length,
          };
        })
        .sort(byName);
    },
    // The catalogue is not audited, so it does not use the audited helper.
    async create(input) {
      await kit.begin();
      kit.assertUnique(
        db.technologies,
        input.name,
        (t) => t.name,
        null,
        `"${input.name}" is already in the catalogue.`,
        'name',
      );
      const technology = { ...copy(input), id: kit.uniqueId('tech', input.name, db.technologies) };
      db.technologies.push(technology);
      return copy(technology);
    },
    async update(id, input) {
      await kit.begin();
      findOrThrow(db.technologies, id, 'Technology');
      kit.assertUnique(
        db.technologies,
        input.name,
        (t) => t.name,
        id,
        `"${input.name}" is already in the catalogue.`,
        'name',
      );
      return copy(replaceRow(db.technologies, { ...copy(input), id }));
    },
    async remove(id) {
      await kit.begin('portfolio:delete');
      findOrThrow(db.technologies, id, 'Technology');
      const impact = technologyDeletionImpact(db, id);
      if (impact.blockedReason) throw new ValidationError(impact.blockedReason);
      removeRow(db.technologies, id);
    },
    async getDeletionImpact(id) {
      await wait();
      findOrThrow(db.technologies, id, 'Technology');
      return technologyDeletionImpact(db, id);
    },
  };

  const governance: GovernanceRepository = {
    getPortfolioOverview: async () => (await wait(), buildPortfolioOverview(db, new Date())),
    getApplicationHealthReport: async () => (
      await wait(),
      buildApplicationHealthReport(db, new Date())
    ),
  };

  return { people, businessUnits, teams, technologies, governance };
}
