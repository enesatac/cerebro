import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { ReleaseInput } from '../types';

export function useSaveRelease(id?: EntityId) {
  const { releases } = useRepositories();
  return useRepositoryMutation(
    (input: ReleaseInput) => (id ? releases.update(id, input) : releases.create(input)),
    {
      successTitle: (release) =>
        id
          ? `${release.releaseNumber} güncellendi`
          : `Canlı geçiş kaydedildi: ${release.releaseNumber}`,
    },
  );
}

export function useDeleteRelease() {
  const { releases } = useRepositories();
  return useRepositoryMutation((id: EntityId) => releases.remove(id), {
    successTitle: () => 'Canlı geçiş silindi',
  });
}
