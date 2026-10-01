import type { BusinessUnitRepository } from '@/domains/business-units/api/BusinessUnitRepository';
import type { EntityId } from '@/domains/shared/types';
import type { BusinessUnitInput } from '@/domains/business-units/types';
import type { GovernanceRepository } from '@/domains/governance/api/GovernanceRepository';
import {
  buildApplicationHealthReport,
  buildPortfolioOverview,
} from '@/domains/governance/utils/portfolio';
import { buildPortfolioTrends } from '@/domains/governance/utils/trends';
import type { PersonRepository } from '@/domains/people/api/PersonRepository';
import type { PersonInput } from '@/domains/people/types';
import type { TeamRepository } from '@/domains/teams/api/TeamRepository';
import type { Team } from '@/domains/teams/types';
import type { TechnologyRepository } from '@/domains/technologies/api/TechnologyRepository';
import { ValidationError } from '@/lib/errors';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import {
  businessUnitDeletionImpact,
  deleteBusinessUnitCascade,
  deleteTeamCascade,
  personDeletionImpact,
  teamDeletionImpact,
  technologyDeletionImpact,
} from './cascade';
import type { MockDatabase } from './database';
import { buildPersonWorkload } from './personWorkload';
import type { Lookup } from './lookup';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
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

  // People and business units are master data: not audited, managed by administrators.
  const validatePerson = (input: PersonInput, excludeId: EntityId | null) => {
    kit.assertUnique(
      db.people,
      input.email,
      (p) => p.email,
      excludeId,
      `${input.email} adresiyle kayıtlı bir kişi zaten var.`,
      'email',
    );
    kit.assertRefs([input.businessUnitId], db.businessUnits, 'iş birimi', 'businessUnitId');
  };

  const people: PersonRepository = {
    list: async () => (await wait(), copy(db.people)),
    getById: async (id) => (await wait(), copy(findOrThrow(db.people, id, 'Kişi'))),
    getWorkload: async (id, today) => (await wait(), buildPersonWorkload(db, lookup, id, today)),
    async create(input) {
      await kit.begin('masterData:manage');
      validatePerson(input, null);
      const person = { ...copy(input), id: kit.nextId('people') };
      db.people.push(person);
      return copy(person);
    },
    async update(id, input) {
      await kit.begin('masterData:manage');
      findOrThrow(db.people, id, 'Kişi');
      validatePerson(input, id);
      return copy(replaceRow(db.people, { ...copy(input), id }));
    },
    async remove(id) {
      await kit.begin('masterData:manage');
      findOrThrow(db.people, id, 'Kişi');
      const impact = personDeletionImpact(db, id);
      if (impact.blockedReason) throw new ValidationError(impact.blockedReason);
      removeRow(db.people, id);
    },
    async getDeletionImpact(id) {
      await wait();
      findOrThrow(db.people, id, 'Kişi');
      return personDeletionImpact(db, id);
    },
  };

  const validateBusinessUnit = (input: BusinessUnitInput, excludeId: EntityId | null) => {
    kit.assertUnique(
      db.businessUnits,
      input.code,
      (b) => b.code,
      excludeId,
      `"${input.code}" kodu başka bir iş birimi tarafından kullanılıyor.`,
      'code',
    );
    kit.assertUnique(
      db.businessUnits,
      input.name,
      (b) => b.name,
      excludeId,
      `"${input.name}" adında bir iş birimi zaten var.`,
      'name',
    );
    kit.assertRefs([input.headId], db.people, 'kişi', 'headId');
  };

  const businessUnits: BusinessUnitRepository = {
    list: async () => (await wait(), copy(db.businessUnits)),
    async create(input) {
      await kit.begin('masterData:manage');
      validateBusinessUnit(input, null);
      const unit = { ...copy(input), id: kit.nextId('businessUnits') };
      db.businessUnits.push(unit);
      return copy(unit);
    },
    async update(id, input) {
      await kit.begin('masterData:manage');
      findOrThrow(db.businessUnits, id, 'İş birimi');
      validateBusinessUnit(input, id);
      return copy(replaceRow(db.businessUnits, { ...copy(input), id }));
    },
    async remove(id) {
      await kit.begin('masterData:manage');
      findOrThrow(db.businessUnits, id, 'İş birimi');
      const impact = businessUnitDeletionImpact(db, id);
      if (impact.blockedReason) throw new ValidationError(impact.blockedReason);
      deleteBusinessUnitCascade(db, id);
      removeRow(db.businessUnits, id);
    },
    async getDeletionImpact(id) {
      await wait();
      findOrThrow(db.businessUnits, id, 'İş birimi');
      return businessUnitDeletionImpact(db, id);
    },
  };

  const teams: TeamRepository = {
    list: async () => (await wait(), copy(db.teams)),
    getById: async (id) => (await wait(), copy(findOrThrow(db.teams, id, 'Ekip'))),
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
      entityLabel: 'Ekip',
      sequence: 'teams',
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input, excludeId) {
        kit.assertUnique(
          db.teams,
          input.name,
          (t) => t.name,
          excludeId,
          `"${input.name}" adında bir ekip zaten var.`,
          'name',
        );
        kit.assertRefs([input.managerId, ...input.memberIds], db.people, 'kişi', 'memberIds');
      },
      impact: (id) => teamDeletionImpact(db, id),
      cascade: (id) => deleteTeamCascade(db, id),
    }),
  };

  const technologies: TechnologyRepository = {
    list: async () => (await wait(), copy(db.technologies)),
    getById: async (id) => (await wait(), copy(findOrThrow(db.technologies, id, 'Teknoloji'))),
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
      assertCodeChecks(db, codeChecks.technology(input));
      kit.assertUnique(
        db.technologies,
        input.name,
        (t) => t.name,
        null,
        `"${input.name}" zaten katalogda.`,
        'name',
      );
      const technology = { ...copy(input), id: kit.nextId('technologies') };
      db.technologies.push(technology);
      return copy(technology);
    },
    async update(id, input) {
      await kit.begin();
      const current = findOrThrow(db.technologies, id, 'Teknoloji');
      assertCodeChecks(db, codeChecks.technology(input), codeChecks.technology(current));
      kit.assertUnique(
        db.technologies,
        input.name,
        (t) => t.name,
        id,
        `"${input.name}" zaten katalogda.`,
        'name',
      );
      return copy(replaceRow(db.technologies, { ...copy(input), id }));
    },
    async remove(id) {
      await kit.begin('portfolio:delete');
      findOrThrow(db.technologies, id, 'Teknoloji');
      const impact = technologyDeletionImpact(db, id);
      if (impact.blockedReason) throw new ValidationError(impact.blockedReason);
      removeRow(db.technologies, id);
    },
    async getDeletionImpact(id) {
      await wait();
      findOrThrow(db.technologies, id, 'Teknoloji');
      return technologyDeletionImpact(db, id);
    },
  };

  const governance: GovernanceRepository = {
    getPortfolioOverview: async () => (await wait(), buildPortfolioOverview(db, new Date())),
    getTrends: async (period, today) => (await wait(), buildPortfolioTrends(db, period, today)),
    getApplicationHealthReport: async () => (
      await wait(),
      buildApplicationHealthReport(db, new Date())
    ),
  };

  return { people, businessUnits, teams, technologies, governance };
}
