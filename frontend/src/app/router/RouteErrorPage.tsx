import { useRouteError } from 'react-router';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getErrorMessage } from '@/lib/errors';

/** Last-resort boundary for errors thrown while rendering a route. */
export function RouteErrorPage() {
  const error = useRouteError();
  return (
    <main className="c-route-error">
      <ErrorState
        title="Bir şeyler ters gitti"
        description={getErrorMessage(error)}
        onRetry={() => window.location.reload()}
        retryLabel="Sayfayı yenile"
      />
    </main>
  );
}
