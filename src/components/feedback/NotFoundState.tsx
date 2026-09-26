import { ButtonLink } from '../actions/ButtonLink';
import { EmptyState } from './EmptyState';

interface NotFoundStateProps {
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
}

export function NotFoundState({ title, description, backTo, backLabel }: NotFoundStateProps) {
  return (
    <div className="c-not-found">
      <h1 className="c-page-header__title">{title}</h1>
      <EmptyState
        title="Nothing to show here"
        description={description}
        action={
          <ButtonLink to={backTo} variant="neutral" appearance="outlined">
            {backLabel}
          </ButtonLink>
        }
      />
    </div>
  );
}
