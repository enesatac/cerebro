import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { ContractId, ContractQuery } from '../types';

export const contractKeys = {
  all: ['contracts'] as const,
  list: (query: ContractQuery) => [...contractKeys.all, 'list', query] as const,
  detail: (id: ContractId) => [...contractKeys.all, 'detail', id] as const,
  vendors: ['vendors'] as const,
};

export function useContracts(query: ContractQuery = {}) {
  const { contracts } = useRepositories();
  return useQuery({ queryKey: contractKeys.list(query), queryFn: () => contracts.list(query) });
}

export function useContract(id: ContractId) {
  const { contracts } = useRepositories();
  return useQuery({ queryKey: contractKeys.detail(id), queryFn: () => contracts.getById(id) });
}

export function useVendors() {
  const { vendors } = useRepositories();
  return useQuery({ queryKey: contractKeys.vendors, queryFn: () => vendors.list() });
}
