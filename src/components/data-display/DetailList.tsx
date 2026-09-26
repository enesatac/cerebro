import type { ReactNode } from 'react';

export interface DetailItem {
  label: string;
  /** `null`/`undefined`/empty string render the empty placeholder. */
  value: ReactNode;
  /** Shown instead of the default placeholder when the value is missing. */
  emptyText?: string;
}

interface DetailListProps {
  items: DetailItem[];
  /** `grid` lays pairs out in responsive columns; `stacked` is one pair per row. */
  layout?: 'grid' | 'stacked';
}

const isEmpty = (value: ReactNode) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/** Label/value pairs rendered as a semantic description list with explicit empty values. */
export function DetailList({ items, layout = 'stacked' }: DetailListProps) {
  return (
    <dl className={`c-detail-list c-detail-list--${layout}`}>
      {items.map((item, index) => (
        // Labels can repeat (e.g. two delivery teams), so the position disambiguates.
        <div className="c-detail-list__item" key={`${item.label}-${index}`}>
          <dt className="c-detail-list__label">{item.label}</dt>
          <dd className="c-detail-list__value">
            {isEmpty(item.value) ? (
              <span className="c-muted">{item.emptyText ?? 'Belirtilmemiş'}</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
