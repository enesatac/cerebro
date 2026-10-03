import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PermissionDeniedState } from '@/components/feedback/PermissionDeniedState';
import { useCurrentUser } from '@/domains/auth/api/queries';
import { hasPrivilege } from '@/domains/auth/utils/permissions';
import { ADMIN_NAVIGATION, PRIMARY_NAVIGATION } from '../layout/navigation';
import { paths } from './paths';

/**
 * The start page: the dashboard for roles that may see it, otherwise the first screen the user's
 * roles allow (a business-unit user lands on their demands).
 */
export function HomeRoute({ dashboard }: { dashboard: ReactNode }) {
  const user = useCurrentUser();
  if (hasPrivilege(user, 'dashboard:view')) return <>{dashboard}</>;
  const first = [...PRIMARY_NAVIGATION, ...ADMIN_NAVIGATION].find((item) =>
    hasPrivilege(user, item.privilege),
  );
  return first ? (
    <Navigate to={first.to} replace />
  ) : (
    <PermissionDeniedState
      action="herhangi bir ekranı görüntüleme"
      backTo={paths.signIn()}
      backLabel="Başka bir hesapla giriş yap"
    />
  );
}
