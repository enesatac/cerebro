interface ChartLegendProps {
  items: readonly { key: string; label: string; color: string }[];
  /** Mirrors the mark: a swatch for bars/areas, a short line for lines. */
  shape?: 'box' | 'line';
}

/** Series key for charts with two or more series (identity is never colour-matching alone). */
export function ChartLegend({ items, shape = 'box' }: ChartLegendProps) {
  if (items.length < 2) return null;
  return (
    <ul className="c-chart-legend" aria-label="Açıklama">
      {items.map((item) => (
        <li key={item.key}>
          <span
            className={`c-chart-legend__key c-chart-legend__key--${shape}`}
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
