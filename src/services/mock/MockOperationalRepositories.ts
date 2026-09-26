import type { ConnectionRepository } from '@/domains/connections/api/ConnectionRepository';
import type { ApplicationDependency, Integration } from '@/domains/connections/types';
import type { DecisionRepository } from '@/domains/decisions/api/DecisionRepository';
import type { Decision } from '@/domains/decisions/types';
import type { EscalationRepository } from '@/domains/escalations/api/EscalationRepository';
import type { Escalation } from '@/domains/escalations/types';
import type { RiskRepository } from '@/domains/risks/api/RiskRepository';
import type { RelatedEntityFilter, Risk } from '@/domains/risks/types';
import { ValidationError } from '@/lib/errors';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import type { MockDatabase } from './database';
import { copy, delay, findOrThrow } from './query';
import type { WriteKit } from './writeKit';

interface Related {
  relatedApplicationIds: string[];
  relatedProjectIds: string[];
}

function matchesRelated(row: Related, filter: RelatedEntityFilter | undefined): boolean {
  if (filter?.applicationId && !row.relatedApplicationIds.includes(filter.applicationId))
    return false;
  if (filter?.projectId && !row.relatedProjectIds.includes(filter.projectId)) return false;
  return true;
}

/** Risks, escalations, decisions, dependencies and integrations. */
export function createMockOperationalRepositories(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
) {
  const wait = () => delay(latencyMs);
  const assertRelated = (input: Related) => {
    kit.assertRefs(
      input.relatedApplicationIds,
      db.applications,
      'application',
      'relatedApplicationIds',
    );
    kit.assertRefs(input.relatedProjectIds, db.projects, 'project', 'relatedProjectIds');
    if (input.relatedApplicationIds.length + input.relatedProjectIds.length === 0) {
      throw new ValidationError(
        'Link at least one application or project.',
        'relatedApplicationIds',
      );
    }
  };

  const risks: RiskRepository = {
    list: async (filter) => (await wait(), copy(db.risks.filter((r) => matchesRelated(r, filter)))),
    getById: async (id) => (await wait(), copy(findOrThrow(db.risks, id, 'Risk'))),
    ...createAuditedWriteRepository<Risk, Omit<Risk, 'id' | 'audit'>>({
      kit,
      latencyMs,
      rows: () => db.risks,
      entityLabel: 'Risk',
      idPrefix: 'risk',
      nameOf: (input) => input.title,
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input) {
        kit.assertRefs([input.ownerId], db.people, 'person', 'ownerId');
        assertRelated(input);
      },
    }),
  };

  const escalations: EscalationRepository = {
    list: async (filter) => (
      await wait(),
      copy(db.escalations.filter((e) => matchesRelated(e, filter)))
    ),
    getById: async (id) => (await wait(), copy(findOrThrow(db.escalations, id, 'Escalation'))),
    ...createAuditedWriteRepository<Escalation, Omit<Escalation, 'id' | 'audit'>>({
      kit,
      latencyMs,
      rows: () => db.escalations,
      entityLabel: 'Escalation',
      idPrefix: 'esc',
      nameOf: (input) => input.title,
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input) {
        kit.assertRefs([input.ownerId, input.raisedById], db.people, 'person', 'ownerId');
        kit.assertRefs([input.responsibleTeamId], db.teams, 'team', 'responsibleTeamId');
        assertRelated(input);
      },
    }),
  };

  const decisions: DecisionRepository = {
    list: async (filter) => (
      await wait(),
      copy(db.decisions.filter((d) => matchesRelated(d, filter)))
    ),
    getById: async (id) => (await wait(), copy(findOrThrow(db.decisions, id, 'Decision'))),
    ...createAuditedWriteRepository<Decision, Omit<Decision, 'id' | 'audit'>>({
      kit,
      latencyMs,
      rows: () => db.decisions,
      entityLabel: 'Decision',
      idPrefix: 'dec',
      nameOf: (input) => input.title,
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input) {
        kit.assertRefs(input.decidedByIds, db.people, 'person', 'decidedByIds');
        assertRelated(input);
      },
    }),
  };

  const connections: ConnectionRepository = {
    async getApplicationDependencies(applicationId) {
      await wait();
      return copy({
        outgoing: db.dependencies.filter((d) => d.sourceApplicationId === applicationId),
        incoming: db.dependencies.filter((d) => d.targetApplicationId === applicationId),
      });
    },
    async getApplicationIntegrations(applicationId) {
      await wait();
      return copy({
        outbound: db.integrations.filter((i) => i.fromApplicationId === applicationId),
        inbound: db.integrations.filter((i) => i.toApplicationId === applicationId),
      });
    },
    listDependencies: async () => (await wait(), copy(db.dependencies)),
    listIntegrations: async () => (await wait(), copy(db.integrations)),
    dependencies: {
      getById: async (id) => (await wait(), copy(findOrThrow(db.dependencies, id, 'Dependency'))),
      ...createAuditedWriteRepository<
        ApplicationDependency,
        Omit<ApplicationDependency, 'id' | 'audit'>
      >({
        kit,
        latencyMs,
        rows: () => db.dependencies,
        entityLabel: 'Dependency',
        idPrefix: 'dep',
        nameOf: (input) =>
          `${input.sourceApplicationId}-${input.targetApplicationId}`.replace(/app-/g, ''),
        build: (input, id, audit) => ({ ...input, id, audit }),
        validate(input, excludeId) {
          kit.assertRefs(
            [input.sourceApplicationId, input.targetApplicationId],
            db.applications,
            'application',
            'targetApplicationId',
          );
          if (input.sourceApplicationId === input.targetApplicationId) {
            throw new ValidationError(
              'An application cannot depend on itself.',
              'targetApplicationId',
            );
          }
          const duplicate = db.dependencies.some(
            (d) =>
              d.id !== excludeId &&
              d.sourceApplicationId === input.sourceApplicationId &&
              d.targetApplicationId === input.targetApplicationId &&
              d.type === input.type,
          );
          if (duplicate)
            throw new ValidationError(
              'This dependency is already recorded.',
              'targetApplicationId',
            );
        },
      }),
    },
    integrations: {
      getById: async (id) => (await wait(), copy(findOrThrow(db.integrations, id, 'Integration'))),
      ...createAuditedWriteRepository<Integration, Omit<Integration, 'id' | 'audit'>>({
        kit,
        latencyMs,
        rows: () => db.integrations,
        entityLabel: 'Integration',
        idPrefix: 'int',
        nameOf: (input) => input.name,
        build: (input, id, audit) => ({ ...input, id, audit }),
        validate(input) {
          kit.assertRefs(
            [input.fromApplicationId, input.toApplicationId],
            db.applications,
            'application',
            'toApplicationId',
          );
          if ((input.toApplicationId === null) === (input.externalPartyName === null)) {
            throw new ValidationError(
              'Choose either a target application or an external party.',
              'toApplicationId',
            );
          }
        },
      }),
    },
  };

  return { risks, escalations, decisions, connections };
}
