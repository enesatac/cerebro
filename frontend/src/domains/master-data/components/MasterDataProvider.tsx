import { useMemo, type ReactNode } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useMasterDataLists } from '../api/queries';
import { MasterDataContext } from '../context';
import { createMasterDataIndex } from '../utils/masterDataIndex';

/**
 * Loads the value lists once and makes them available synchronously to every page. Admin edits
 * invalidate the query, so new labels, colours and options appear across the site immediately.
 */
export function MasterDataProvider({ children }: { children: ReactNode }) {
  const query = useMasterDataLists();
  const index = useMemo(
    () => (query.data ? createMasterDataIndex(query.data) : null),
    [query.data],
  );

  if (query.isPending) return <LoadingState label="Ana veriler yükleniyor" rows={6} />;
  if (!index) {
    return <ErrorState title="Ana veriler yüklenemedi" onRetry={() => void query.refetch()} />;
  }
  return <MasterDataContext.Provider value={index}>{children}</MasterDataContext.Provider>;
}
