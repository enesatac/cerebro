import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { IsoDate } from '@/domains/shared/types';
import { useElementWidth } from '@/hooks/useElementWidth';
import { formatMonthShort, formatMonthYear } from '@/lib/dates';
import { formatInteger } from '@/lib/format';
import { niceScale } from './scale';
import type { ChartSeries } from './types';

interface MonthlyChartProps {
  months: readonly IsoDate[];
  /** Index of the current month; later months are plans and are drawn as such. */
  currentIndex: number;
  series: readonly ChartSeries[];
  kind: 'line' | 'stacked';
  /** Accessible name, e.g. "Aylık aktif proje sayısı". */
  label: string;
  formatValue?: (value: number) => string;
  /** Counts get whole-number ticks; measures (FTE, days) may not. */
  integer?: boolean;
  height?: number;
}

const MARGIN = { top: 20, right: 20, bottom: 40, left: 40 };
const MAX_BAR = 24;
const GAP = 2;
const RADIUS = 4;
const MIN_LABEL_SPACING = 46;

/** Rectangle with only the top corners rounded (columns grow from a square baseline). */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `H${x + w - radius}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `V${y + h}`,
    'Z',
  ].join(' ');
}

/**
 * Monthly time series as lines or stacked columns, on one axis. Months after the current one are
 * plans: shaded, dashed lines, lighter columns. A crosshair (pointer) or the arrow keys pick a
 * month; the tooltip lists every series for it. Tooltips enhance, never gate — the card's table
 * view holds every value.
 */
export function MonthlyChart({
  months,
  currentIndex,
  series,
  kind,
  label,
  formatValue = formatInteger,
  integer = true,
  height = 240,
}: MonthlyChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const count = months.length;
  const plotWidth = Math.max(10, width - MARGIN.left - MARGIN.right);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const band = plotWidth / Math.max(1, count);
  const center = (index: number) => MARGIN.left + band * (index + 0.5);

  const totals = months.map((_, index) =>
    series.reduce((sum, s) => sum + (s.values[index] ?? 0), 0),
  );
  const peak =
    kind === 'stacked'
      ? Math.max(0, ...totals)
      : Math.max(0, ...series.flatMap((s) => s.values.map((v) => v ?? 0)));
  const scale = niceScale(peak, 4, integer);
  const y = (value: number) => MARGIN.top + plotHeight - (value / scale.max) * plotHeight;
  const baseline = y(0);

  const isPlan = (index: number) => currentIndex >= 0 && index > currentIndex;
  const labelEvery = Math.max(1, Math.ceil(MIN_LABEL_SPACING / band));
  const barWidth = Math.min(MAX_BAR, band * 0.62);

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - box.left) / band);
    setActive(Math.min(count - 1, Math.max(0, index)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = active ?? (currentIndex >= 0 ? currentIndex : count - 1);
    const next =
      event.key === 'ArrowLeft'
        ? from - 1
        : event.key === 'ArrowRight'
          ? from + 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(Math.min(count - 1, Math.max(0, next)));
  };

  const linePath = (values: readonly (number | null)[], from: number, to: number) => {
    let path = '';
    let drawing = false;
    for (let index = from; index <= to; index += 1) {
      const value = values[index];
      if (value == null) {
        drawing = false;
        continue;
      }
      path += `${drawing ? 'L' : 'M'}${center(index)},${y(value)} `;
      drawing = true;
    }
    return path.trim();
  };

  const lastIndex = (values: readonly (number | null)[]) => {
    for (let index = values.length - 1; index >= 0; index -= 1) {
      if (values[index] != null) return index;
    }
    return -1;
  };

  // Direct label: the current month's value (or the last one), never every point.
  const highlight = currentIndex >= 0 ? currentIndex : count - 1;
  const single = series.length === 1 ? series[0] : undefined;

  const tooltipIndex = active;
  // The tooltip sits beside the crosshair (never over the marks it describes).
  const tooltipOnLeft = tooltipIndex !== null && center(tooltipIndex) > width / 2;
  const tooltipLeft = tooltipIndex === null ? 0 : center(tooltipIndex) + (tooltipOnLeft ? -12 : 12);

  return (
    <div
      ref={ref}
      className="c-chart"
      role="group"
      aria-label={`${label}. Ayları ok tuşlarıyla gezin; tüm değerler tablo görünümündedir.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={() => setActive((current) => current ?? highlight)}
      onBlur={() => setActive(null)}
    >
      <svg width={width} height={height} aria-hidden="true" className="c-chart__svg">
        {currentIndex >= 0 && currentIndex < count - 1 && (
          <g>
            <rect
              className="c-chart__plan"
              x={MARGIN.left + band * (currentIndex + 1)}
              y={MARGIN.top}
              width={band * (count - currentIndex - 1)}
              height={plotHeight}
            />
            <text
              className="c-chart__plan-label"
              x={MARGIN.left + band * (currentIndex + 1) + 4}
              y={MARGIN.top - 6}
            >
              Plan
            </text>
          </g>
        )}

        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? 'c-chart__axis' : 'c-chart__grid'}
              x1={MARGIN.left}
              x2={MARGIN.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className="c-chart__tick"
              x={MARGIN.left - 8}
              y={y(tick)}
              dy="0.32em"
              textAnchor="end"
            >
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {months.map((month, index) =>
          index % labelEvery === 0 ? (
            <text
              key={month}
              className={`c-chart__tick${index === currentIndex ? ' c-chart__tick--current' : ''}`}
              x={center(index)}
              y={baseline + 16}
              textAnchor="middle"
            >
              <tspan>{formatMonthShort(month)}</tspan>
              {(index === 0 || month.slice(5, 7) === '01') && (
                <tspan x={center(index)} dy="1.2em">
                  {month.slice(0, 4)}
                </tspan>
              )}
            </text>
          ) : null,
        )}

        {kind === 'stacked' &&
          months.map((month, index) => {
            let acc = 0;
            const layers = series
              .map((s) => ({ key: s.key, color: s.color, value: s.values[index] ?? 0 }))
              .filter((layer) => layer.value > 0);
            return (
              <g key={month} className={isPlan(index) ? 'c-chart__plan-marks' : undefined}>
                {layers.map((layer, layerIndex) => {
                  const bottom = y(acc);
                  acc += layer.value;
                  const top = y(acc);
                  const isTop = layerIndex === layers.length - 1;
                  // A 2px surface gap separates stacked segments (no borders around marks).
                  const segmentBottom = layerIndex === 0 ? bottom : bottom - GAP;
                  const segmentHeight = Math.max(0, segmentBottom - top);
                  const x = center(index) - barWidth / 2;
                  return isTop ? (
                    <path
                      key={layer.key}
                      d={topRoundedRect(x, top, barWidth, segmentHeight, RADIUS)}
                      fill={layer.color}
                    />
                  ) : (
                    <rect
                      key={layer.key}
                      x={x}
                      y={top}
                      width={barWidth}
                      height={segmentHeight}
                      fill={layer.color}
                    />
                  );
                })}
                {index === highlight && (totals[index] ?? 0) > 0 && (
                  <text
                    className="c-chart__value"
                    x={center(index)}
                    y={y(totals[index] ?? 0) - 6}
                    textAnchor="middle"
                  >
                    {formatValue(totals[index] ?? 0)}
                  </text>
                )}
              </g>
            );
          })}

        {kind === 'line' &&
          series.map((s) => {
            const split = currentIndex >= 0 ? Math.min(currentIndex, count - 1) : count - 1;
            const end = lastIndex(s.values);
            const area =
              single && end >= 0
                ? `${linePath(s.values, 0, end)} L${center(end)},${baseline} L${center(
                    s.values.findIndex((v) => v != null),
                  )},${baseline} Z`
                : null;
            return (
              <g key={s.key}>
                {area && <path d={area} fill={s.color} className="c-chart__area" />}
                <path d={linePath(s.values, 0, split)} stroke={s.color} className="c-chart__line" />
                {split < count - 1 && (
                  <path
                    d={linePath(s.values, split, count - 1)}
                    stroke={s.color}
                    className="c-chart__line c-chart__line--plan"
                  />
                )}
                {end >= 0 && (
                  <circle
                    cx={center(end)}
                    cy={y(s.values[end] ?? 0)}
                    r={4}
                    fill={s.color}
                    className="c-chart__dot"
                  />
                )}
              </g>
            );
          })}

        {kind === 'line' && single && single.values[highlight] != null && (
          <g>
            <circle
              cx={center(highlight)}
              cy={y(single.values[highlight] ?? 0)}
              r={4}
              fill={single.color}
              className="c-chart__dot"
            />
            <text
              className="c-chart__value c-chart__value--halo"
              x={center(highlight)}
              y={y(single.values[highlight] ?? 0) - 12}
              textAnchor="middle"
            >
              {formatValue(single.values[highlight] ?? 0)}
            </text>
          </g>
        )}

        {active !== null && (
          <g>
            <line
              className="c-chart__crosshair"
              x1={center(active)}
              x2={center(active)}
              y1={MARGIN.top}
              y2={baseline}
            />
            {kind === 'line' &&
              series.map((s) =>
                s.values[active] != null ? (
                  <circle
                    key={s.key}
                    cx={center(active)}
                    cy={y(s.values[active] ?? 0)}
                    r={4}
                    fill={s.color}
                    className="c-chart__dot"
                  />
                ) : null,
              )}
            {kind === 'stacked' && (
              <rect
                className="c-chart__hover-band"
                x={MARGIN.left + band * active}
                y={MARGIN.top}
                width={band}
                height={plotHeight}
              />
            )}
          </g>
        )}

        <rect
          className="c-chart__hit"
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotWidth}
          height={plotHeight}
          onPointerMove={pick}
          onPointerLeave={() => setActive(null)}
        />
      </svg>

      <div className="c-chart__live" aria-live="polite">
        {tooltipIndex !== null && (
          <div
            className={`c-chart__tooltip${tooltipOnLeft ? ' c-chart__tooltip--left' : ''}`}
            style={{ left: tooltipLeft }}
          >
            <p className="c-chart__tooltip-title">
              {formatMonthYear(months[tooltipIndex] ?? '')}
              {isPlan(tooltipIndex) && <span className="c-muted"> · plan</span>}
            </p>
            <ul>
              {[...series]
                .reverse()
                // A stack lists what is in the column; zero layers would only add noise.
                .filter((s) => kind === 'line' || (s.values[tooltipIndex] ?? 0) !== 0)
                .map((s) => (
                  <li key={s.key}>
                    <span
                      className="c-chart__tooltip-key"
                      style={{ background: s.color }}
                      aria-hidden="true"
                    />
                    <strong>
                      {s.values[tooltipIndex] == null
                        ? '—'
                        : formatValue(s.values[tooltipIndex] ?? 0)}
                    </strong>
                    <span>{s.label}</span>
                  </li>
                ))}
              {kind === 'stacked' && series.length > 1 && (
                <li className="c-chart__tooltip-total">
                  <strong>{formatValue(totals[tooltipIndex] ?? 0)}</strong>
                  <span>Toplam</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
