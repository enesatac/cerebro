import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface StatTileProps {
  label: string;
  value: number | string;
  /** Short qualifier under the number, e.g. "3 critical". */
  detail?: ReactNode;
  /** Where the number can be explored; makes the whole tile a link. */
  to?: string;
  /** Draws attention (warning ink) when the number signals a problem. */
  tone?: 'default' | 'warning';
}

/** A single headline number. No chart — one number needs no plot. */
export function StatTile({ label, value, detail, to, tone = 'default' }: StatTileProps) {
  const body = (
    <>
      <span className="c-stat-tile__label">{label}</span>
      <span
        className={`c-stat-tile__value${tone === 'warning' ? ' c-stat-tile__value--warning' : ''}`}
      >
        {value}
      </span>
      {detail && <span className="c-stat-tile__detail">{detail}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="c-stat-tile c-stat-tile--link">
      {body}
    </Link>
  ) : (
    <div className="c-stat-tile">{body}</div>
  );
}
