import { attachmentsOnlyImpact, deleteAttachmentsOf } from './cascade';
import type { ConnectionRepository } from '@/domains/connections/api/ConnectionRepository';
import type { ApplicationDependency, Integration } from '@/domains/connections/types';
import type { DecisionRepository } from '@/domains/decisions/api/DecisionRepository';
import type { Decision } from '@/domains/decisions/types';
import type { EscalationRepository } from '@/domains/escalations/api/EscalationRepository';
import type { Escalation } from '@/domains/escalations/types';
import type { RiskRepository } from '@/domains/risks/api/RiskRepository';
import type { RelatedEntityFilter, Risk } from '@/domains/risks/types';
import type { EntityId } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import type { MockDatabase } from './database';
import { copy, delay, findOrThrow } from './query';
import type { WriteKit } from './writeKit';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';

interface Related {
  relatedApplicationIds: EntityId[];
  relatedProjectIds: EntityId[];
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
      'uygulama',
      'relatedApplicationIds',
    );
    kit.assertRefs(input.relatedProjectIds, db.projects, 'proje', 'relatedProjectIds');
    if (input.relatedApplicationIds.length + input.relatedProjectIds.length === 0) {
      throw new ValidationError('En az bir uygulama veya proje bağlayın.', 'relatedApplicationIds');
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
      sequence: 'risks',
      impact: (id) => attachmentsOnlyImpact(db, { type: 'risk', id }),
      cascade: (id) => deleteAttachmentsOf(db, { type: 'risk', id }),
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input, excludeId) {
        const previous = excludeId ? db.risks.find((row) => row.id === excludeId) : undefined;
        assertCodeChecks(db, codeChecks.risk(input), previous ? codeChecks.risk(previous) : []);
        kit.assertRefs([input.ownerId], db.people, 'kişi', 'ownerId');
        assertRelated(input);
      },
    }),
  };

  const escalations: EscalationRepository = {
    list: async (filter) => (
      await wait(),
      copy(db.escalations.filter((e) => matchesRelated(e, filter)))
    ),
    getById: async (id) => (await wait(), copy(findOrThrow(db.escalations, id, 'Eskalasyon'))),
    ...createAuditedWriteRepository<Escalation, Omit<Escalation, 'id' | 'audit'>>({
      kit,
      latencyMs,
      rows: () => db.escalations,
      entityLabel: 'Eskalasyon',
      sequence: 'escalations',
      impact: (id) => attachmentsOnlyImpact(db, { type: 'escalation', id }),
      cascade: (id) => deleteAttachmentsOf(db, { type: 'escalation', id }),
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input, excludeId) {
        const previous = excludeId ? db.escalations.find((row) => row.id === excludeId) : undefined;
        assertCodeChecks(
          db,
          codeChecks.escalation(input),
          previous ? codeChecks.escalation(previous) : [],
        );
        kit.assertRefs([input.ownerId, input.raisedById], db.people, 'kişi', 'ownerId');
        kit.assertRefs([input.responsibleTeamId], db.teams, 'ekip', 'responsibleTeamId');
        assertRelated(input);
      },
    }),
  };

  const decisions: DecisionRepository = {
    list: async (filter) => (
      await wait(),
      copy(db.decisions.filter((d) => matchesRelated(d, filter)))
    ),
    getById: async (id) => (await wait(), copy(findOrThrow(db.decisions, id, 'Karar'))),
    ...createAuditedWriteRepository<Decision, Omit<Decision, 'id' | 'audit'>>({
      kit,
      latencyMs,
      rows: () => db.decisions,
      entityLabel: 'Karar',
      sequence: 'decisions',
      impact: (id) => attachmentsOnlyImpact(db, { type: 'decision', id }),
      cascade: (id) => deleteAttachmentsOf(db, { type: 'decision', id }),
      build: (input, id, audit) => ({ ...input, id, audit }),
      validate(input, excludeId) {
        const previous = excludeId ? db.decisions.find((row) => row.id === excludeId) : undefined;
        assertCodeChecks(
          db,
          codeChecks.decision(input),
          previous ? codeChecks.decision(previous) : [],
        );
        kit.assertRefs(input.decidedByIds, db.people, 'kişi', 'decidedByIds');
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
      getById: async (id) => (await wait(), copy(findOrThrow(db.dependencies, id, 'Bağımlılık'))),
      ...createAuditedWriteRepository<
        ApplicationDependency,
        Omit<ApplicationDependency, 'id' | 'audit'>
      >({
        kit,
        latencyMs,
        rows: () => db.dependencies,
        entityLabel: 'Bağımlılık',
        sequence: 'dependencies',
        build: (input, id, audit) => ({ ...input, id, audit }),
        validate(input, excludeId) {
          const previous = excludeId
            ? db.dependencies.find((row) => row.id === excludeId)
            : undefined;
          assertCodeChecks(
            db,
            codeChecks.dependency(input),
            previous ? codeChecks.dependency(previous) : [],
          );
          kit.assertRefs(
            [input.sourceApplicationId, input.targetApplicationId],
            db.applications,
            'uygulama',
            'targetApplicationId',
          );
          if (input.sourceApplicationId === input.targetApplicationId) {
            throw new ValidationError(
              'Bir uygulama kendisine bağımlı olamaz.',
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
            throw new ValidationError('Bu bağımlılık zaten kayıtlı.', 'targetApplicationId');
        },
      }),
    },
    integrations: {
      getById: async (id) => (await wait(), copy(findOrThrow(db.integrations, id, 'Entegrasyon'))),
      ...createAuditedWriteRepository<Integration, Omit<Integration, 'id' | 'audit'>>({
        kit,
        latencyMs,
        rows: () => db.integrations,
        entityLabel: 'Entegrasyon',
        sequence: 'integrations',
        build: (input, id, audit) => ({ ...input, id, audit }),
        validate(input, excludeId) {
          const previous = excludeId
            ? db.integrations.find((row) => row.id === excludeId)
            : undefined;
          assertCodeChecks(
            db,
            codeChecks.integration(input),
            previous ? codeChecks.integration(previous) : [],
          );
          kit.assertRefs(
            [input.fromApplicationId, input.toApplicationId],
            db.applications,
            'uygulama',
            'toApplicationId',
          );
          if ((input.toApplicationId === null) === (input.externalPartyName === null)) {
            throw new ValidationError(
              'Hedef uygulama veya harici taraftan birini seçin.',
              'toApplicationId',
            );
          }
        },
      }),
    },
  };

  return { risks, escalations, decisions, connections };
}
