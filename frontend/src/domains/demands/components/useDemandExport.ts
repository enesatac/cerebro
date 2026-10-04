import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { loadPortfolioNames } from '@/domains/shared/utils/portfolioNames';
import { useRepositories } from '@/services/RepositoryContext';
import type { Demand } from '../types';
import { demandSheet } from '../utils/demandExport';

/**
 * Builds the demand workbook for an "Excel'e aktar" button. Application and project names are
 * loaded when the export runs, so tables do not subscribe to them.
 */
export function useDemandExport() {
  const repositories = useRepositories();
  const masterData = useMasterData();
  const people = usePeopleById();
  const units = useBusinessUnitsById();
  return (demands: readonly Demand[], options: { title: string; subtitle?: string }) =>
    async () => {
      const portfolio = await loadPortfolioNames(repositories);
      return [
        demandSheet(
          demands,
          masterData,
          {
            ...portfolio,
            person: (id) => (id === null ? undefined : people.data?.get(id)?.fullName),
            unit: (id) => units.data?.get(id)?.name,
          },
          options,
        ),
      ];
    };
}
