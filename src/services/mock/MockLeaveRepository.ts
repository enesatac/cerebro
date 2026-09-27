import type { LeaveRepository } from '@/domains/leaves/api/LeaveRepository';
import type { LeaveInput, LeaveRecord } from '@/domains/leaves/types';
import type { EntityId } from '@/domains/shared/types';
import { formatDateRange } from '@/lib/dates';
import { ValidationError } from '@/lib/errors';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import type { MockDatabase } from './database';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
import { copy, delay, findOrThrow } from './query';
import type { WriteKit } from './writeKit';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function createMockLeaveRepository(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
): LeaveRepository {
  const validate = (input: LeaveInput, excludeId: EntityId | null) => {
    kit.assertRefs([input.personId], db.people, 'kişi', 'personId');
    const previous = excludeId ? db.leaves.find((row) => row.id === excludeId) : undefined;
    assertCodeChecks(db, codeChecks.leave(input), previous ? codeChecks.leave(previous) : []);
    if (!ISO_DATE.test(input.startDate) || !ISO_DATE.test(input.endDate)) {
      throw new ValidationError('Geçerli tarihler girin.', 'startDate');
    }
    if (input.endDate < input.startDate) {
      throw new ValidationError('Bitiş tarihi başlangıçtan önce olamaz.', 'endDate');
    }
    // One person cannot be on two leaves at once (an exclusion constraint in the database).
    const clash = db.leaves.find(
      (row) =>
        row.id !== excludeId &&
        row.personId === input.personId &&
        row.startDate <= input.endDate &&
        input.startDate <= row.endDate,
    );
    if (clash) {
      throw new ValidationError(
        `Bu kişinin ${formatDateRange(clash.startDate, clash.endDate)} tarihlerinde başka bir izni var.`,
        'startDate',
      );
    }
  };

  return {
    async list({ from, to, personIds }) {
      await delay(latencyMs);
      return copy(
        db.leaves
          .filter(
            (row) =>
              row.startDate <= to &&
              from <= row.endDate &&
              (!personIds || personIds.includes(row.personId)),
          )
          .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id),
      );
    },
    getById: async (id) => (await delay(latencyMs), copy(findOrThrow(db.leaves, id, 'İzin'))),
    ...createAuditedWriteRepository<LeaveRecord, LeaveInput>({
      kit,
      latencyMs,
      rows: () => db.leaves,
      entityLabel: 'İzin',
      sequence: 'leaves',
      permissions: { write: 'leaves:manage', remove: 'leaves:manage' },
      build: (input, id, audit) => ({ ...input, note: input.note.trim(), id, audit }),
      validate,
    }),
  };
}
