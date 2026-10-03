import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { ContractInput, VendorInput } from '../types';

export function useSaveContract(id?: EntityId) {
  const { contracts } = useRepositories();
  return useRepositoryMutation(
    (input: ContractInput) => (id ? contracts.update(id, input) : contracts.create(input)),
    {
      successTitle: (contract) =>
        id ? `${contract.code} güncellendi` : `Sözleşme kaydedildi: ${contract.code}`,
    },
  );
}

export function useDeleteContract() {
  const { contracts } = useRepositories();
  return useRepositoryMutation((id: EntityId) => contracts.remove(id), {
    successTitle: () => 'Sözleşme silindi',
  });
}

export function useSaveVendor(id?: EntityId) {
  const { vendors } = useRepositories();
  return useRepositoryMutation(
    (input: VendorInput) => (id ? vendors.update(id, input) : vendors.create(input)),
    { successTitle: (vendor) => (id ? `${vendor.name} güncellendi` : `${vendor.name} eklendi`) },
  );
}

export function useDeleteVendor() {
  const { vendors } = useRepositories();
  return useRepositoryMutation((id: EntityId) => vendors.remove(id), {
    successTitle: () => 'Tedarikçi silindi',
  });
}
