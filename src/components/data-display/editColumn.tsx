import type { TableColumnDef } from '@takeoff-ui/react-spar';
import { Link } from 'react-router';

/** Trailing "Edit" link column for editable registers; add it only for users who may edit. */
export function editColumn<T>(
  to: (row: T) => string,
  describe: (row: T) => string,
): TableColumnDef<T> {
  return {
    id: 'actions',
    header: <span className="c-visually-hidden">Actions</span>,
    align: 'end',
    width: 80,
    cell: ({ row }) => (
      <Link to={to(row.original)} className="c-link" aria-label={`Edit ${describe(row.original)}`}>
        Edit
      </Link>
    ),
  };
}
