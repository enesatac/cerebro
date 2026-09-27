import { useMasterData } from '@/domains/master-data/context';

/** Colour key for the calendar: active leave types, weekends and today. */
export function LeaveLegend() {
  const types = useMasterData()
    .items('leaveTypes')
    .filter((item) => item.active);
  return (
    <ul className="c-leave-legend" aria-label="Renk açıklaması">
      {types.map((item) => (
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
