import { paths } from '@/app/router/paths';
import type { EntityId } from '@/domains/shared/types';
import { EntityLink } from '@/components/data-display/EntityLink';
import { useApplicationRefs } from '../api/queries';

/** Resolves an application id to a linked name + code. */
export function ApplicationRefLink({ applicationId }: { applicationId: EntityId }) {
  const refs = useApplicationRefs();
  const ref = refs.data?.get(applicationId);
  return (
    <span className="c-cell-stack">
      <EntityLink to={paths.applications.detail(applicationId)}>
        {ref?.name ?? applicationId}
      </EntityLink>
      {ref && <span className="c-muted c-cell-stack__secondary">{ref.code}</span>}
    </span>
  );
}
