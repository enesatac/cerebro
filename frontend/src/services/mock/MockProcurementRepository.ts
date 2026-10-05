import type { SessionUser } from '@/domains/auth/types';
import { hasPrivilege } from '@/domains/auth/utils/permissions';
import type { ProcurementRepository } from '@/domains/procurement/api/ProcurementRepository';
import type {
  ProcurementNote,
  ProcurementProcess,
  ProcurementStep,
  ProcurementStepDraft,
  ProcurementSummary,
} from '@/domains/procurement/types';
import type { EntityId } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import { looksLikeSecret, NO_SECRETS_MESSAGE } from '@/lib/validation';
import type { MockDatabase } from './database';
import { assertCodeChecks } from './MockMasterDataRepository';
import { copy, findOrThrow } from './query';
import { removeRow, type WriteKit } from './writeKit';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_STEPS = 30;

/** Step rules shared with the API: dates in order, a finished step has its end date. */
function validateSteps(steps: readonly ProcurementStepDraft[]) {
  if (steps.length > MAX_STEPS) {
    throw new ValidationError(`En fazla ${MAX_STEPS} adım girilebilir.`, 'steps');
  }
  steps.forEach((step, index) => {
    const field = (name: string) => `steps.${index}.${name}`;
    for (const name of ['plannedStart', 'plannedEnd', 'actualStart', 'actualEnd'] as const) {
      const value = step[name];
      if (value !== null && !ISO_DATE.test(value)) {
        throw new ValidationError('Geçerli bir tarih girin.', field(name));
      }
    }
    if (step.plannedStart && step.plannedEnd && step.plannedEnd < step.plannedStart) {
      throw new ValidationError('Planlanan bitiş başlangıçtan önce olamaz.', field('plannedEnd'));
    }
    if (step.actualStart && step.actualEnd && step.actualEnd < step.actualStart) {
      throw new ValidationError('Gerçekleşen bitiş başlangıçtan önce olamaz.', field('actualEnd'));
    }
    if (step.status === 'done' && !step.actualEnd) {
      throw new ValidationError('Tamamlanan adımın bitiş tarihini girin.', field('actualEnd'));
    }
    if (step.status === 'in-progress' && !step.actualStart) {
      throw new ValidationError('Başlayan adımın başlangıç tarihini girin.', field('actualStart'));
    }
    if (step.note.length > 1000) {
      throw new ValidationError('Not en fazla 1000 karakter olabilir.', field('note'));
    }
    if (looksLikeSecret(step.note)) throw new ValidationError(NO_SECRETS_MESSAGE, field('note'));
  });
}

/**
 * The procurement tracker over the mock tables. Steps and notes hang off a contract; the read
 * models leave out commercial terms so business units can be given `procurement:view`.
 */
export function createMockProcurementRepository(
  db: MockDatabase,
  kit: WriteKit,
): ProcurementRepository {
  const stepsOf = (contractId: EntityId): ProcurementStep[] =>
    db.procurementSteps
      .filter((row) => row.contractId === contractId)
      .map(({ contractId: _contract, ...step }) => step);

  const notesFor = (contractId: EntityId, user: SessionUser): ProcurementNote[] =>
    db.procurementNotes
      .filter(
        (row) =>
          row.contractId === contractId &&
          (!row.internal || hasPrivilege(user, 'procurement:edit')),
      )
      .map(({ contractId: _contract, ...note }) => note)
      .sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id);

  const summary = (contractId: EntityId, user: SessionUser): ProcurementSummary => {
    const contract = findOrThrow(db.contracts, contractId, 'Satın alma');
    const notes = notesFor(contractId, user);
    return {
      contractId,
      code: contract.code,
      title: contract.title,
      projectId: contract.projectId,
      businessUnitId: db.projects.find((p) => p.id === contract.projectId)?.businessUnitId ?? null,
      vendorName: db.vendors.find((v) => v.id === contract.vendorId)?.name ?? '',
      contractStatus: contract.status,
      ownerId: contract.ownerId,
      steps: stepsOf(contractId),
      noteCount: notes.length,
      lastNoteAt: notes[0]?.at ?? null,
    };
  };

  const process = (contractId: EntityId, user: SessionUser): ProcurementProcess => ({
    ...summary(contractId, user),
    notes: notesFor(contractId, user),
  });

  return {
    async list() {
      const user = await kit.begin('procurement:view');
      return copy(db.contracts.map((c) => summary(c.id, user)));
    },
    async getById(contractId) {
      const user = await kit.begin('procurement:view');
      return copy(process(contractId, user));
    },
    async saveSteps(contractId, steps) {
      const user = await kit.begin('procurement:edit');
      findOrThrow(db.contracts, contractId, 'Satın alma');
      const current = stepsOf(contractId);
      assertCodeChecks(
        db,
        [
          { list: 'procurementSteps', codes: steps.map((s) => s.type), field: 'steps' },
          { list: 'procurementStepStatuses', codes: steps.map((s) => s.status), field: 'steps' },
        ],
        [
          { list: 'procurementSteps', codes: current.map((s) => s.type), field: 'steps' },
          { list: 'procurementStepStatuses', codes: current.map((s) => s.status), field: 'steps' },
        ],
      );
      kit.assertRefs(
        steps.map((s) => s.ownerId),
        db.people,
        'kişi',
        'steps',
      );
      validateSteps(steps);
      const stored = kit
        .withIds<ProcurementStep>(
          steps.map((s) => ({ ...s, note: s.note.trim() })),
          'procurementSteps',
          current,
        )
        .map((step) => ({ ...step, contractId }));
      db.procurementSteps = [
        ...db.procurementSteps.filter((row) => row.contractId !== contractId),
        ...stored,
      ];
      return copy(process(contractId, user));
    },
    async addNote(contractId, { text, internal }) {
      const user = await kit.begin('procurement:edit');
      findOrThrow(db.contracts, contractId, 'Satın alma');
      const body = text.trim();
      if (!body) throw new ValidationError('Notu yazın.', 'text');
      if (body.length > 2000) {
        throw new ValidationError('Not en fazla 2000 karakter olabilir.', 'text');
      }
      if (looksLikeSecret(body)) throw new ValidationError(NO_SECRETS_MESSAGE, 'text');
      const note = {
        id: kit.nextId('procurementNotes'),
        contractId,
        at: kit.newAudit(user).createdAt,
        authorId: user.personId,
        text: body,
        internal,
      };
      db.procurementNotes.push(note);
      const { contractId: _contract, ...stored } = note;
      return copy(stored);
    },
    async removeNote(noteId) {
      await kit.begin('procurement:edit');
      findOrThrow(db.procurementNotes, noteId, 'Not');
      removeRow(db.procurementNotes, noteId);
    },
  };
}
