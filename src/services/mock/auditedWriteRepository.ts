import type { AuditMetadata, DeletionImpact, WriteRepository } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { NO_IMPACT } from './cascade';
import { copy, delay, findOrThrow } from './query';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

interface AuditedEntity {
  id: string;
  audit: AuditMetadata;
}

interface AuditedWriteOptions<T extends AuditedEntity, I> {
  kit: WriteKit;
  latencyMs: number;
  /** Getter, because cascades may replace the underlying array. */
  rows: () => T[];
  entityLabel: string;
  idPrefix: string;
  nameOf: (input: I) => string;
  build: (input: I, id: string, audit: AuditMetadata) => T;
  validate?: (input: I, excludeId: string | null) => void;
  impact?: (id: string) => DeletionImpact;
  cascade?: (id: string) => void;
}

/** create / update / remove / getDeletionImpact for an audited aggregate, with permission checks. */
export function createAuditedWriteRepository<T extends AuditedEntity, I>(
  options: AuditedWriteOptions<T, I>,
): WriteRepository<T, I> {
  const { kit, rows, entityLabel } = options;
  return {
    async create(input) {
      const user = await kit.begin();
      options.validate?.(input, null);
      const entity = options.build(
        copy(input),
        kit.uniqueId(options.idPrefix, options.nameOf(input), rows()),
        kit.newAudit(user),
      );
      rows().push(entity);
      return copy(entity);
    },
    async update(id, input) {
      const user = await kit.begin();
      const current = findOrThrow(rows(), id, entityLabel);
      options.validate?.(input, id);
      return copy(
        replaceRow(rows(), options.build(copy(input), id, kit.touch(current.audit, user))),
      );
    },
    async remove(id) {
      await kit.begin('portfolio:delete');
      findOrThrow(rows(), id, entityLabel);
      const impact = options.impact?.(id) ?? NO_IMPACT;
      if (impact.blockedReason) throw new ValidationError(impact.blockedReason);
      options.cascade?.(id);
      removeRow(rows(), id);
    },
    async getDeletionImpact(id) {
      await delay(options.latencyMs);
      findOrThrow(rows(), id, entityLabel);
      return options.impact?.(id) ?? NO_IMPACT;
    },
  };
}
