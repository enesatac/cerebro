import type { TableColumnDef } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Trailing row actions for editable registers: an "Edit" link and, optionally, a delete action
 * (which guards its own permission). Add the column only for users who may edit.
 */
export function editColumn<T>(
  to: (row: T) => string,
  describe: (row: T) => string,
  renderDelete?: (row: T) => ReactNode,
): TableColumnDef<T> {
  return {
    id: 'actions',
    header: <span className="c-visually-hidden">İşlemler</span>,
    align: 'end',
    width: renderDelete ? 110 : 80,
    cell: ({ row }) => (
      <span className="c-row-actions">
        <Link
          to={to(row.original)}
          className="c-link"
          aria-label={`Düzenle: ${describe(row.original)}`}
        >
          Düzenle
        </Link>
        {renderDelete?.(row.original)}
      </span>
    ),
  };
}
