import { ButtonLink } from '../actions/ButtonLink';
import { EmptyState } from './EmptyState';

interface PermissionDeniedStateProps {
  /** What the user tried to do, e.g. "edit applications". */
  action: string;
  backTo: string;
  backLabel: string;
}

export function PermissionDeniedState({ action, backTo, backLabel }: PermissionDeniedStateProps) {
  return (
    <div className="c-not-found">
      <h1 className="c-page-header__title">You do not have access</h1>
      <EmptyState
        title={`Your role does not allow you to ${action}`}
        description="Ask a Cerebro administrator if you need this access."
        action={
          <ButtonLink to={backTo} variant="neutral" appearance="outlined">
            {backLabel}
          </ButtonLink>
        }
      />
    </div>
  );
}
