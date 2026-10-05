import type { EntityId } from '@/domains/shared/types';
import type {
  ProcurementNote,
  ProcurementNoteInput,
  ProcurementProcess,
  ProcurementStepDraft,
  ProcurementSummary,
} from '../types';

/**
 * The procurement tracker: the process of every purchase (contract) — steps, dates, notes —
 * without its commercial terms. Reading needs `procurement:view` (business units included);
 * changing steps and writing or deleting notes needs `procurement:edit`.
 */
export interface ProcurementRepository {
  /** Every purchase with its steps, in contract order. */
  list(): Promise<ProcurementSummary[]>;
  /** @throws NotFoundError */
  getById(contractId: EntityId): Promise<ProcurementProcess>;
  /**
   * Replaces the steps (order included); stored steps keep their ids.
   * @throws ValidationError (dates, statuses, owners)
   */
  saveSteps(contractId: EntityId, steps: ProcurementStepDraft[]): Promise<ProcurementProcess>;
  addNote(contractId: EntityId, input: ProcurementNoteInput): Promise<ProcurementNote>;
  removeNote(noteId: EntityId): Promise<void>;
}
