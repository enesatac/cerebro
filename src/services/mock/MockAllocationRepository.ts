import type { AllocationRepository } from '@/domains/resources/api/AllocationRepository';
import {
  ALLOCATION_PERCENT,
  type Allocation,
  type AllocationInput,
} from '@/domains/resources/types';
import type { EntityId } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { createAuditedWriteRepository } from './auditedWriteRepository';
import type { MockDatabase } from './database';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
import { copy, delay, findOrThrow } from './query';
import type { WriteKit } from './writeKit';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resource allocations. Overlaps are allowed — parallel work is what the planner shows — but the
 * same person cannot be planned twice onto the same project for overlapping days.
 */
export function createMockAllocationRepository(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
): AllocationRepository {
  const validate = (input: AllocationInput, excludeId: EntityId | null) => {
    kit.assertRefs([input.personId], db.people, 'kişi', 'personId');
    kit.assertRefs([input.projectId], db.projects, 'proje', 'projectId');
    const previous = excludeId ? db.allocations.find((row) => row.id === excludeId) : undefined;
    assertCodeChecks(
      db,
      codeChecks.allocation(input),
      previous ? codeChecks.allocation(previous) : [],
    );
    if (!ISO_DATE.test(input.startDate) || !ISO_DATE.test(input.endDate)) {
      throw new ValidationError('Geçerli tarihler girin.', 'startDate');
    }
    if (input.endDate < input.startDate) {
      throw new ValidationError('Bitiş tarihi başlangıçtan önce olamaz.', 'endDate');
    }
    const { min, max, step } = ALLOCATION_PERCENT;
    if (
      !Number.isInteger(input.percent) ||
      input.percent < min ||
      input.percent > max ||
      input.percent % step !== 0
    ) {
      throw new ValidationError(
        `Doluluk %${min}–%${max} arasında, ${step}'in katı olmalı.`,
        'percent',
      );
    }
    const duplicate = db.allocations.find(
      (row) =>
        row.id !== excludeId &&
        row.personId === input.personId &&
        row.projectId === input.projectId &&
        row.startDate <= input.endDate &&
        input.startDate <= row.endDate,
    );
    if (duplicate) {
      throw new ValidationError(
        'Bu kişi bu tarihlerde zaten bu projeye atanmış. Mevcut atamayı düzenleyin.',
        'projectId',
      );
    }
  };

  return {
    async list({ from, to, personIds, projectIds }) {
      await delay(latencyMs);
      return copy(
        db.allocations
          .filter(
            (row) =>
              row.startDate <= to &&
              from <= row.endDate &&
              (!personIds || personIds.includes(row.personId)) &&
              (!projectIds || projectIds.includes(row.projectId)),
          )
          .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id),
      );
    },
    getById: async (id) => (await delay(latencyMs), copy(findOrThrow(db.allocations, id, 'Atama'))),
    ...createAuditedWriteRepository<Allocation, AllocationInput>({
      kit,
      latencyMs,
      rows: () => db.allocations,
      entityLabel: 'Atama',
      sequence: 'allocations',
      permissions: { write: 'resources:manage', remove: 'resources:manage' },
      build: (input, id, audit) => ({ ...input, note: input.note.trim(), id, audit }),
      validate,
    }),
  };
}
