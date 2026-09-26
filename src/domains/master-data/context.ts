import { createContext, useContext } from 'react';
import type { MasterDataIndex } from './utils/masterDataIndex';

export const MasterDataContext = createContext<MasterDataIndex | null>(null);

/** Labels, badges and options of the administrable value lists (inside `MasterDataProvider`). */
export function useMasterData(): MasterDataIndex {
  const index = useContext(MasterDataContext);
  if (!index) throw new Error('useMasterData must be used inside <MasterDataProvider>.');
  return index;
}
