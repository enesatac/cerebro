import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import { getListDefinition } from '../catalog';
import type { MasterDataItem, MasterDataListKey } from '../types';

export function useSaveMasterDataList(key: MasterDataListKey) {
  const { masterData } = useRepositories();
  return useRepositoryMutation((items: MasterDataItem[]) => masterData.update(key, items), {
    successTitle: () => `${getListDefinition(key).label} güncellendi`,
    successDescription: () => 'Değişiklikler sitenin tamamına yansıtıldı.',
  });
}
