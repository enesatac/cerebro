import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { ButtonLink } from '@/components/actions/ButtonLink';
import type { Privilege } from '../types';
import { Can } from './Can';

interface ActionProps {
  to: string;
  label: string;
  /** The edit privilege of the screen the action belongs to, e.g. `projects:edit`. */
  privilege: Privilege;
}

/** Primary "create" button on list pages; rendered only for roles that may edit. */
export function CreateAction({ to, label, privilege }: ActionProps) {
  return (
    <Can privilege={privilege}>
      <ButtonLink to={to} startContent={<AddIconOutlinedRounded aria-hidden="true" />}>
        {label}
      </ButtonLink>
    </Can>
  );
}

/** "Edit" button on detail pages; rendered only for roles that may edit. */
export function EditAction({
  to,
  label = 'Düzenle',
  privilege,
}: Omit<ActionProps, 'label'> & { label?: string }) {
  return (
    <Can privilege={privilege}>
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
export function SmallCreateAction({ to, label, privilege }: ActionProps) {
  return (
    <Can privilege={privilege}>
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
