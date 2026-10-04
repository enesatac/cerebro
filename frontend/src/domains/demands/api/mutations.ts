import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { DemandAssessmentInput, DemandId, DemandInput } from '../types';

export function useSaveDemand(id?: DemandId) {
  const { demands } = useRepositories();
  return useRepositoryMutation(
    (input: DemandInput) => (id ? demands.update(id, input) : demands.create(input)),
    id
      ? { successTitle: () => 'Talep güncellendi' }
      : {
          successTitle: (demand) => `Talep gönderildi: ${demand.code}`,
          successDescription: () => 'Portföy ofisi talebi değerlendirip size dönüş yapacak.',
        },
  );
}

export function useAssessDemand(id: DemandId) {
  const { demands } = useRepositories();
  return useRepositoryMutation((input: DemandAssessmentInput) => demands.assess(id, input), {
    successTitle: (demand) => `${demand.code} değerlendirmesi kaydedildi`,
  });
}

export function useWithdrawDemand(id: DemandId) {
  const { demands } = useRepositories();
  return useRepositoryMutation((note: string) => demands.withdraw(id, note), {
    successTitle: (demand) => `${demand.code} geri çekildi`,
  });
}

export function useDeleteDemand() {
  const { demands } = useRepositories();
  return useRepositoryMutation((id: EntityId) => demands.remove(id), {
    successTitle: () => 'Talep silindi',
  });
}
