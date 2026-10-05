import type { ReleaseRepository } from '@/domains/releases/api/ReleaseRepository';
import type { Release, ReleaseInput } from '@/domains/releases/types';
import type { EntityId } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { looksLikeSecret, NO_SECRETS_MESSAGE } from '@/lib/validation';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import type { MockDatabase } from './database';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
import { copy, findOrThrow } from './query';
import type { WriteKit } from './writeKit';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Text limits shared with the API (`ReleaseService`). */
const TEXTS = [
  ['releaseNumber', 'Geçiş numarası', 40],
  ['title', 'Başlık', 200],
  ['version', 'Sürüm', 40],
  ['description', 'Geçiş detayları', 4000],
  ['rollbackPlan', 'Geri alma planı', 2000],
  ['outcomeNote', 'Sonuç notu', 2000],
] as const;

const byWindow = (a: Release, b: Release) =>
  a.plannedDate.localeCompare(b.plannedDate) ||
  a.startTime.localeCompare(b.startTime) ||
  a.releaseNumber.localeCompare(b.releaseNumber) ||
  a.id - b.id;

export function createMockReleaseRepository(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
): ReleaseRepository {
  const validate = (input: ReleaseInput, excludeId: EntityId | null) => {
    if (!input.releaseNumber.trim()) {
      throw new ValidationError('Geçiş numarası zorunludur.', 'releaseNumber');
    }
    if (!input.title.trim()) throw new ValidationError('Başlık zorunludur.', 'title');
    for (const [field, label, max] of TEXTS) {
      const value = input[field];
      if (value.length > max) {
        throw new ValidationError(`${label} en fazla ${max} karakter olabilir.`, field);
      }
      if (looksLikeSecret(value)) throw new ValidationError(NO_SECRETS_MESSAGE, field);
    }
    kit.assertUnique(
      db.releases,
      input.releaseNumber,
      (row) => row.releaseNumber,
      excludeId,
      `${input.releaseNumber.trim()} numaralı bir geçiş zaten var.`,
      'releaseNumber',
    );
    kit.assertRefs([input.applicationId], db.applications, 'uygulama', 'applicationId');
    kit.assertRefs([input.projectId], db.projects, 'proje', 'projectId');
    kit.assertRefs([input.ownerId], db.people, 'kişi', 'ownerId');
    const previous = excludeId ? db.releases.find((row) => row.id === excludeId) : undefined;
    assertCodeChecks(db, codeChecks.release(input), previous ? codeChecks.release(previous) : []);
    if (!ISO_DATE.test(input.plannedDate)) {
      throw new ValidationError('Geçerli bir tarih girin.', 'plannedDate');
    }
    for (const field of ['startTime', 'endTime'] as const) {
      if (input[field] !== '' && !TIME.test(input[field])) {
        throw new ValidationError('Saati SS:DD biçiminde girin.', field);
      }
    }
    if (input.endTime !== '' && input.startTime === '') {
      throw new ValidationError('Bitiş saati için başlangıç saatini de girin.', 'startTime');
    }
  };

  return {
    async list({ from, to, applicationId, projectId } = {}) {
      await kit.begin('releases:view');
      return copy(
        db.releases
          .filter(
            (row) =>
              (!from || row.plannedDate >= from) &&
              (!to || row.plannedDate <= to) &&
              (applicationId === undefined || row.applicationId === applicationId) &&
              (projectId === undefined || row.projectId === projectId),
          )
          .sort(byWindow),
      );
    },
    async getById(id) {
      await kit.begin('releases:view');
      return copy(findOrThrow(db.releases, id, 'Canlı geçiş'));
    },
    ...createAuditedWriteRepository<Release, ReleaseInput>({
      kit,
      latencyMs,
      rows: () => db.releases,
      entityLabel: 'Canlı geçiş',
      sequence: 'releases',
      permissions: { write: 'releases:edit', remove: 'releases:delete' },
      build: (input, id, audit) => ({
        ...input,
        releaseNumber: input.releaseNumber.trim(),
        title: input.title.trim(),
        version: input.version.trim(),
        description: input.description.trim(),
        rollbackPlan: input.rollbackPlan.trim(),
        outcomeNote: input.outcomeNote.trim(),
        id,
        audit,
      }),
      validate,
    }),
  };
}
