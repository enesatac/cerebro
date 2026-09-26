import { useRouteError } from 'react-router';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getErrorMessage } from '@/lib/errors';

/** Last-resort boundary for errors thrown while rendering a route. */
export function RouteErrorPage() {
  const error = useRouteError();
  return (
    <main className="c-route-error">
      <ErrorState
        title="Something went wrong"
        description={getErrorMessage(error)}
        onRetry={() => window.location.reload()}
        retryLabel="Reload page"
      />
    </main>
  );
}
