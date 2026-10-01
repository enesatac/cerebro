import { codedColors } from '@/components/charts/chartColors';
import type { CategoryBarItem } from '@/components/charts/CategoryBars';
import type { ChartTable } from '@/components/charts/ChartCard';
import type { ChartSeries } from '@/components/charts/types';
import { useMasterData } from '@/domains/master-data/context';
import type { MasterDataListKey } from '@/domains/master-data/types';
import type { IsoDate } from '@/domains/shared/types';
import { formatMonthYear } from '@/lib/dates';
import { formatInteger } from '@/lib/format';
import type { CategoryCount, TrendSeries } from '../../types';

/**
 * Turns coded report data into chart input: labels and colours from the master data list, in the
 * list's order (so "Düşük → Kritik" reads in order), unknown codes last.
 */
export function useCoded(list: MasterDataListKey) {
  const masterData = useMasterData();
  const items = masterData.items(list);
  const rank = (code: string) => {
    const index = items.findIndex((item) => item.code === code);
    return index === -1 ? items.length : index;
  };

  const series = (trend: readonly TrendSeries[]): ChartSeries[] => {
    const ordered = [...trend].sort((a, b) => rank(a.key) - rank(b.key));
    const colors = codedColors(ordered.map((s) => masterData.badge(list, s.key).variant));
    return ordered.map((s, index) => ({
      key: s.key,
      label: masterData.label(list, s.key),
      color: colors[index] ?? 'currentColor',
      values: s.values,
    }));
  };

  /** Every active value of the list, zeros included, plus any other code that has a count. */
  const bars = (
    counts: readonly CategoryCount[],
    link?: (code: string) => string,
  ): CategoryBarItem[] => {
    const byCode = new Map(counts.map((c) => [c.key, c.value]));
    const codes = [
      ...items.filter((item) => item.active || byCode.has(item.code)).map((item) => item.code),
      ...counts.map((c) => c.key).filter((code) => !items.some((item) => item.code === code)),
    ];
    const colors = codedColors(codes.map((code) => masterData.badge(list, code).variant));
    return codes.map((code, index) => ({
      key: code,
      label: masterData.label(list, code),
      value: byCode.get(code) ?? 0,
      color: colors[index],
      to: link?.(code),
    }));
  };

  return { series, bars };
}

/** Months as rows, series as columns (and a total for stacks) — the chart's table view. */
export function monthlyTable(
  months: readonly IsoDate[],
  series: readonly ChartSeries[],
  {
    total = false,
    format = formatInteger,
  }: { total?: boolean; format?: (v: number) => string } = {},
): ChartTable {
  return {
    head: ['Ay', ...series.map((s) => s.label), ...(total ? ['Toplam'] : [])],
    rows: months.map((month, index) => {
      const values = series.map((s) => s.values[index] ?? null);
      return {
        key: month,
        cells: [
          formatMonthYear(month),
          ...values.map((v) => (v == null ? '—' : format(v))),
          ...(total ? [format(values.reduce<number>((sum, v) => sum + (v ?? 0), 0))] : []),
        ],
      };
    }),
  };
}

export function barsTable(items: readonly CategoryBarItem[], head: string): ChartTable {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return {
    head: [head, 'Sayı', 'Pay'],
    rows: items.map((item) => ({
      key: item.key,
      cells: [
        item.label,
        item.value,
        total === 0 ? '%0' : `%${Math.round((item.value / total) * 100)}`,
      ],
    })),
  };
}
