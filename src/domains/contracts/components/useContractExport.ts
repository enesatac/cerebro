import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { loadPortfolioNames } from '@/domains/shared/utils/portfolioNames';
import { useRepositories } from '@/services/RepositoryContext';
import type { Contract, Vendor } from '../types';
import { contractSheets } from '../utils/contractExport';

/** Builds the contract workbook for an "Excel'e aktar" button; names are loaded on click. */
export function useContractExport(vendors: ReadonlyMap<number, Vendor>) {
  const repositories = useRepositories();
  const masterData = useMasterData();
  const people = usePeopleById();
  return (contracts: readonly Contract[], options: { title: string; subtitle?: string }) =>
    async () => {
      const portfolio = await loadPortfolioNames(repositories);
      return contractSheets(
        contracts,
        masterData,
        {
          project: portfolio.project,
          applications: portfolio.applications,
          person: (id) => (id === null ? undefined : people.data?.get(id)?.fullName),
          vendor: (id) => vendors.get(id)?.name,
        },
        options,
      );
    };
}
