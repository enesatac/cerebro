import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import type { Person } from '../types';
import type { EntityId } from '@/domains/shared/types';

interface PersonSummaryProps {
  person: Person | undefined;
  /** Rendered when the id does not resolve (stale reference). */
  fallbackId?: EntityId;
  showEmail?: boolean;
}

/** Name (linking to the person's page), job title and optional contact for a person. */
export function PersonSummary({ person, fallbackId, showEmail = false }: PersonSummaryProps) {
  if (!person) {
    return <span className="c-muted">Bilinmeyen kişi{fallbackId ? ` (${fallbackId})` : ''}</span>;
  }
  return (
    <span className="c-cell-stack">
      <EntityLink to={paths.people.detail(person.id)}>{person.fullName}</EntityLink>
      <span className="c-muted c-cell-stack__secondary">
        {person.jobTitle}
        {showEmail && (
          <>
            {' · '}
            <a className="c-link" href={`mailto:${person.email}`}>
              {person.email}
            </a>
          </>
        )}
      </span>
    </span>
  );
}
