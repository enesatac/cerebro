import { useMasterData } from '@/domains/master-data/context';

/** Colour key for the release calendar: statuses, weekends and today. */
export function ReleaseLegend() {
  const statuses = useMasterData()
    .items('releaseStatuses')
    .filter((item) => item.active);
  return (
    <ul className="c-leave-legend" aria-label="Renk açıklaması">
      {statuses.map((item) => (
        <li key={item.code} className="c-leave-legend__item">
          <span
            className={`c-leave-legend__swatch c-leave c-leave--${item.variant ?? 'neutral'}`}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
      <li className="c-leave-legend__item">
        <span
          className="c-leave-legend__swatch c-leave-legend__swatch--weekend"
          aria-hidden="true"
        />
        Hafta sonu
      </li>
      <li className="c-leave-legend__item">
        <span className="c-leave-legend__swatch c-leave-legend__swatch--today" aria-hidden="true" />
        Bugün
      </li>
    </ul>
  );
}
