/** One plotted series, already resolved to a label and a colour. */
export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: (number | null)[];
}
