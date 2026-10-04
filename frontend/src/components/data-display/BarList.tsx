import { Link } from 'react-router';

export interface BarListItem {
  id: string;
  label: string;
  value: number;
  /** Optional drill-down; the row becomes a link (and doubles as the accessible table view). */
  to?: string;
}

interface BarListProps {
  items: readonly BarListItem[];
  /** Accessible name for the list, e.g. "Applications by lifecycle". */
  label: string;
  /** Formats the value for the direct label and accessible name. */
  formatValue?: (value: number) => string;
}

/**
 * Single-series horizontal bars for category magnitudes. One neutral hue (no status colours),
 * direct value labels, bars scaled to the largest value; zero rows keep their label.
 */
export function BarList({ items, label, formatValue = String }: BarListProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="c-bar-list" aria-label={label}>
      {items.map((item) => {
        const content = (
          <>
            <span className="c-bar-list__label">{item.label}</span>
            <span className="c-bar-list__track" aria-hidden="true">
              <span
                className="c-bar-list__bar"
                style={{ width: item.value === 0 ? 0 : `max(4px, ${(item.value / max) * 100}%)` }}
              />
            </span>
            <span className="c-bar-list__value">{formatValue(item.value)}</span>
          </>
        );
        return (
          <li key={item.id}>
            {item.to ? (
              <Link to={item.to} className="c-bar-list__row c-bar-list__row--link">
                {content}
              </Link>
            ) : (
              <span className="c-bar-list__row">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
