import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import type { EntityId } from '@/domains/shared/types';

interface RelatedEntityLinksProps {
  applicationIds: readonly EntityId[];
  projectIds: readonly EntityId[];
}

/** Linked names of the applications and projects a risk, escalation or decision relates to. */
export function RelatedEntityLinks({ applicationIds, projectIds }: RelatedEntityLinksProps) {
  const applications = useApplicationRefs();
  const projects = useProjectRefs();
  if (applicationIds.length === 0 && projectIds.length === 0) {
    return <span className="c-muted">Yok</span>;
  }
  return (
    <ul className="c-plain-list">
      {applicationIds.map((id) => (
        <li key={`application-${id}`}>
          <EntityLink to={paths.applications.detail(id)}>
            {applications.data?.get(id)?.name ?? `#${id}`}
          </EntityLink>
        </li>
      ))}
      {projectIds.map((id) => (
        <li key={`project-${id}`}>
          <EntityLink to={paths.projects.detail(id)}>
            {projects.data?.get(id)?.name ?? `#${id}`}
          </EntityLink>
        </li>
      ))}
    </ul>
  );
}
