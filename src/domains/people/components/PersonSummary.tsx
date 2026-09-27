import type { Person } from '../types';
import type { EntityId } from '@/domains/shared/types';

interface PersonSummaryProps {
  person: Person | undefined;
  /** Rendered when the id does not resolve (stale reference). */
  fallbackId?: EntityId;
  showEmail?: boolean;
}

/** Name, job title and optional contact for a person. People pages arrive in Phase 2. */
export function PersonSummary({ person, fallbackId, showEmail = false }: PersonSummaryProps) {
  if (!person) {
    return <span className="c-muted">Bilinmeyen kişi{fallbackId ? ` (${fallbackId})` : ''}</span>;
  }
  return (
    <span className="c-cell-stack">
      <span>{person.fullName}</span>
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
