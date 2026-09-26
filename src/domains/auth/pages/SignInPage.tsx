import { Alert, Badge, Button } from '@takeoff-ui/react-spar';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { getErrorMessage } from '@/lib/errors';
import { useSession, useSignIn, useSignInAccounts } from '../api/queries';
import { ROLE_PRESENTATION } from '../utils/rolePresentation';

/** Only same-app paths are accepted as redirect targets (prevents open redirects). */
function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : paths.dashboard();
}

export default function SignInPage() {
  const [params] = useSearchParams();
  const redirectTo = safeRedirect(params.get('redirect'));
  const session = useSession();
  const accounts = useSignInAccounts();
  const signIn = useSignIn();
  const navigate = useNavigate();

  if (session.data) return <Navigate to={redirectTo} replace />;

  return (
    <main className="c-sign-in">
      <div className="c-sign-in__panel">
        <div className="c-sign-in__brand">
          <span className="c-topbar__logo" aria-hidden="true" />
          Cerebro
        </div>
        <h1 className="c-page-header__title">Sign in</h1>
        <Alert variant="info" appearance="outlined">
          <Alert.Content>
            <Alert.Title level={2}>Demo sign-in</Alert.Title>
            <Alert.Description>
              Choose an account to continue. Corporate single sign-on will replace this screen;
              Cerebro never stores passwords.
            </Alert.Description>
          </Alert.Content>
        </Alert>
        {signIn.isError && (
          <Alert variant="danger" appearance="outlined" role="alert">
            <Alert.Content>
              <Alert.Description>{getErrorMessage(signIn.error)}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
        {accounts.isPending ? (
          <LoadingState label="Loading accounts" rows={3} />
        ) : accounts.isError ? (
          <ErrorState onRetry={() => void accounts.refetch()} />
        ) : (
          <ul className="c-account-list" aria-label="Accounts">
            {accounts.data.map((account) => (
              <li key={account.id} className="c-account-list__item">
                <span className="c-cell-stack">
                  <span className="c-account-list__name">
                    {account.displayName}{' '}
                    <Badge
                      variant={ROLE_PRESENTATION[account.role].variant}
                      appearance="filledLight"
                      size="small"
                    >
                      {ROLE_PRESENTATION[account.role].label}
                    </Badge>
                  </span>
                  <span className="c-muted c-cell-stack__secondary">
                    {ROLE_PRESENTATION[account.role].description}
                  </span>
                </span>
                <Button
                  size="small"
                  loading={signIn.isPending && signIn.variables === account.id}
                  disabled={signIn.isPending}
                  onClick={() =>
                    signIn.mutate(account.id, {
                      onSuccess: () => void navigate(redirectTo, { replace: true }),
                    })
                  }
                  aria-label={`Continue as ${account.displayName}`}
                >
                  Continue
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
