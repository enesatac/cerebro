import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { Can } from './Can';

/** Primary "create" button on list pages; rendered only for roles that may edit. */
export function CreateAction({ to, label }: { to: string; label: string }) {
  return (
    <Can permission="portfolio:edit">
      <ButtonLink to={to} startContent={<AddIconOutlinedRounded aria-hidden="true" />}>
        {label}
      </ButtonLink>
    </Can>
  );
}

/** "Edit" button on detail pages; rendered only for roles that may edit. */
export function EditAction({ to, label = 'Edit' }: { to: string; label?: string }) {
  return (
    <Can permission="portfolio:edit">
      <ButtonLink
        to={to}
        variant="neutral"
        appearance="outlined"
        startContent={<EditIconOutlinedRounded aria-hidden="true" />}
      >
        {label}
      </ButtonLink>
    </Can>
  );
}

/** Compact "add" button for section headers (e.g. "Record risk" inside a tab). */
export function SmallCreateAction({ to, label }: { to: string; label: string }) {
  return (
    <Can permission="portfolio:edit">
      <ButtonLink
        to={to}
        size="small"
        variant="neutral"
        appearance="outlined"
        startContent={<AddIconOutlinedRounded aria-hidden="true" />}
      >
        {label}
      </ButtonLink>
    </Can>
  );
}
