import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDateTime } from '@/lib/dates';
import type { DemandEvent } from '../types';

/** Every status change, newest first, with who made it and the note they left. */
export function DemandHistory({ events }: { events: readonly DemandEvent[] }) {
  const people = usePeopleById();
  return (
    <ol className="c-demand-history" aria-label="Durum geçmişi">
      {[...events].reverse().map((event) => (
        <li key={event.id} className="c-demand-history__item">
          <div className="c-demand-history__head">
            <MasterBadge list="demandStatuses" code={event.status} />
            <span className="c-muted">
              {formatDateTime(event.at)}
              {event.byId !== null && ` · ${people.data?.get(event.byId)?.fullName ?? '—'}`}
            </span>
          </div>
          {event.note && <p className="c-demand-history__note">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}
