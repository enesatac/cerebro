import { Link } from 'react-router';
import { formatInteger } from '@/lib/format';
import { SINGLE_SERIES_COLOR } from './chartColors';

export interface CategoryBarItem {
  key: string;
  label: string;
  value: number;
  /** Badge colour of a coded value; omitted → the single series hue. */
  color?: string;
  /** Drill-down to the filtered list. */
  to?: string;
}

interface CategoryBarsProps {
  items: readonly CategoryBarItem[];
  label: string;
  formatValue?: (value: number) => string;
}

/**
 * Horizontal bars for a distribution: label, bar (thin, rounded at the data end), value and share
 * at the tip. Every value is printed, so no tooltip is needed; rows with a target are links.
 */
export function CategoryBars({ items, label, formatValue = formatInteger }: CategoryBarsProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <ul className="c-hbars" aria-label={label}>
      {items.map((item) => {
        const share = total === 0 ? 0 : Math.round((item.value / total) * 100);
        const content = (
          <>
            <span className="c-hbars__label">{item.label}</span>
            <span className="c-hbars__track" aria-hidden="true">
              <span
                className="c-hbars__bar"
                style={{
                  width: item.value === 0 ? 0 : `max(4px, ${(item.value / max) * 100}%)`,
                  background: item.color ?? SINGLE_SERIES_COLOR,
                }}
              />
            </span>
            <span className="c-hbars__value">
              {formatValue(item.value)}
              <span className="c-hbars__share"> · %{share}</span>
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.to ? (
              <Link to={item.to} className="c-hbars__row c-hbars__row--link">
                {content}
              </Link>
            ) : (
              <span className="c-hbars__row">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
