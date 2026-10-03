import type { RunbookRepository } from '@/domains/runbooks/api/RunbookRepository';
import type {
  Runbook,
  RunbookContact,
  RunbookInput,
  RunbookLink,
  RunbookScenario,
  RunbookStep,
} from '@/domains/runbooks/types';
import type { AuditMetadata, EntityId } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { isHttpUrl, looksLikeSecret, NO_SECRETS_MESSAGE } from '@/lib/validation';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import type { MockDatabase } from './database';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
import { copy, delay } from './query';
import type { WriteKit } from './writeKit';

/** Every free-text value of a runbook, for the "no credentials" check. */
function texts(input: RunbookInput): string[] {
  return [
    input.summary,
    ...input.firstResponse.map((s) => s.text),
    ...input.links.flatMap((l) => [l.label, l.url, l.note]),
    ...input.contacts.flatMap((c) => [c.label, c.channel, c.when]),
    ...input.scenarios.flatMap((s) => [s.title, s.symptoms, ...s.steps.map((step) => step.text)]),
  ];
}

export function createMockRunbookRepository(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
): RunbookRepository {
  const validate = (input: RunbookInput, excludeId: EntityId | null) => {
    kit.assertRefs([input.applicationId], db.applications, 'uygulama', 'applicationId');
    if (db.runbooks.some((r) => r.id !== excludeId && r.applicationId === input.applicationId)) {
      throw new ValidationError('Bu uygulamanın zaten bir müdahale rehberi var.', 'applicationId');
    }
    kit.assertRefs(
      input.contacts.map((c) => c.personId),
      db.people,
      'kişi',
      'contacts',
    );
    kit.assertRefs(
      input.contacts.map((c) => c.teamId),
      db.teams,
      'ekip',
      'contacts',
    );
    const previous = excludeId ? db.runbooks.find((r) => r.id === excludeId) : undefined;
    assertCodeChecks(db, codeChecks.runbook(input), previous ? codeChecks.runbook(previous) : []);
    input.links.forEach((link, index) => {
      if (!isHttpUrl(link.url)) {
        throw new ValidationError('Tam bir http(s) adresi girin.', `links.${index}.url`);
      }
    });
    input.contacts.forEach((contact, index) => {
      if (!contact.personId && !contact.teamId && !contact.channel.trim()) {
        throw new ValidationError(
          'Bir kişi, ekip veya iletişim kanalı girin.',
          `contacts.${index}.channel`,
        );
      }
    });
    if (texts(input).some(looksLikeSecret)) {
      throw new ValidationError(NO_SECRETS_MESSAGE, 'summary');
    }
  };

  const build = (input: RunbookInput, id: EntityId, audit: AuditMetadata): Runbook => {
    const current = db.runbooks.find((r) => r.id === id);
    const allSteps = current
      ? [...current.firstResponse, ...current.scenarios.flatMap((s) => s.steps)]
      : [];
    const trimSteps = (rows: RunbookInput['firstResponse']) =>
      kit.withIds<RunbookStep>(
        rows.map((row) => ({ ...row, text: row.text.trim() })).filter((row) => row.text !== ''),
        'runbookSteps',
        allSteps,
      );
    const scenarios = kit.withIds<Omit<RunbookScenario, 'steps'> & { id: EntityId }>(
      input.scenarios.map(({ steps: _steps, ...scenario }) => ({
        ...scenario,
        title: scenario.title.trim(),
        symptoms: scenario.symptoms.trim(),
      })),
      'runbookScenarios',
      current?.scenarios ?? [],
    );
    return {
      id,
      applicationId: input.applicationId,
      summary: input.summary.trim(),
      firstResponse: trimSteps(input.firstResponse),
      links: kit.withIds<RunbookLink>(
        input.links.map((l) => ({
          ...l,
          label: l.label.trim(),
          url: l.url.trim(),
          note: l.note.trim(),
        })),
        'runbookLinks',
        current?.links ?? [],
      ),
      contacts: kit.withIds<RunbookContact>(
        input.contacts.map((c) => ({
          ...c,
          label: c.label.trim(),
          channel: c.channel.trim(),
          when: c.when.trim(),
        })),
        'runbookContacts',
        current?.contacts ?? [],
      ),
      scenarios: scenarios.map((scenario, index) => ({
        ...scenario,
        steps: trimSteps(input.scenarios[index]?.steps ?? []),
      })),
      lastVerifiedOn: input.lastVerifiedOn,
      audit,
    };
  };

  return {
    async getByApplication(applicationId) {
      await delay(latencyMs);
      const runbook = db.runbooks.find((r) => r.applicationId === applicationId);
      return runbook ? copy(runbook) : null;
    },
    ...createAuditedWriteRepository<Runbook, RunbookInput>({
      kit,
      latencyMs,
      rows: () => db.runbooks,
      entityLabel: 'Müdahale rehberi',
      sequence: 'runbooks',
      permissions: { write: 'applications:edit', remove: 'applications:delete' },
      build,
      validate,
    }),
  };
}
