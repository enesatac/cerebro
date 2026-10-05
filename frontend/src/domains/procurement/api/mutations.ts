import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { ProcurementNoteInput, ProcurementStepDraft } from '../types';

export function useSaveProcurementSteps(contractId: EntityId) {
  const { procurement } = useRepositories();
  return useRepositoryMutation(
    (steps: ProcurementStepDraft[]) => procurement.saveSteps(contractId, steps),
    { successTitle: (process) => `${process.code} adımları güncellendi` },
  );
}

export function useAddProcurementNote(contractId: EntityId) {
  const { procurement } = useRepositories();
  return useRepositoryMutation(
    (input: ProcurementNoteInput) => procurement.addNote(contractId, input),
    { successTitle: () => 'Not eklendi' },
  );
}

export function useRemoveProcurementNote() {
  const { procurement } = useRepositories();
  return useRepositoryMutation((noteId: EntityId) => procurement.removeNote(noteId), {
    successTitle: () => 'Not silindi',
  });
}
