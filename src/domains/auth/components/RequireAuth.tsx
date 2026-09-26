import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { paths } from '@/app/router/paths';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useSession } from '../api/queries';

/** Renders children only for a signed-in user; otherwise redirects to sign-in and back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) return <LoadingState label="Checking your session" />;
  if (session.isError)
    return (
      <ErrorState
        title="Your session could not be checked"
        onRetry={() => void session.refetch()}
      />
    );
  if (!session.data) {
    return <Navigate to={paths.signIn(`${location.pathname}${location.search}`)} replace />;
  }
  return <>{children}</>;
}
