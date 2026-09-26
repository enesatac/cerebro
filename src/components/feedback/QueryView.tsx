import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { isNotFoundError } from '@/lib/errors';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

interface QueryViewProps<T> {
  query: UseQueryResult<T>;
  loadingLabel: string;
  errorTitle?: string;
  children: (data: T) => ReactNode;
}

/**
 * Renders the loading and error states of a query consistently and hands successful data to
 * `children`. Empty states stay with the caller because their copy is always context-specific.
 */
export function QueryView<T>({ query, loadingLabel, errorTitle, children }: QueryViewProps<T>) {
  if (query.isPending) return <LoadingState label={loadingLabel} rows={3} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <EmptyState
        title="Bu kayıt bulunamadı"
        description="Silinmiş olabilir ya da bağlantı hatalı olabilir."
      />
    ) : (
      <ErrorState title={errorTitle} onRetry={() => void query.refetch()} />
    );
  }
  return <>{children(query.data)}</>;
}
