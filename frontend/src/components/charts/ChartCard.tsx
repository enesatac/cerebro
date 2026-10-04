import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useState, type ReactNode } from 'react';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { SectionCard } from '@/components/layout/SectionCard';
import { formatDecimal, formatInteger } from '@/lib/format';
import { sheet } from '@/lib/xlsxTypes';
import { ChartLegend } from './ChartLegend';

export type ChartCellType = 'text' | 'integer' | 'decimal' | 'percent';

/**
 * A chart's numbers as rows. Cells stay raw (numbers, `null` for "no data") so the on-screen table
 * and the Excel export format them from the same source — numbers reach Excel as numbers.
 */
export interface ChartTable {
  head: string[];
  /** Per column; the first column defaults to `text`, the others to `integer`. */
  types?: ChartCellType[];
  rows: { key: string; cells: (string | number | null)[] }[];
}

const typeOf = (table: ChartTable, index: number): ChartCellType =>
  table.types?.[index] ?? (index === 0 ? 'text' : 'integer');

function formatCell(value: string | number | null, type: ChartCellType): string {
  if (value === null) return '—';
  if (typeof value === 'string') return value;
  if (type === 'percent') return `%${value}`;
  return type === 'decimal' ? formatDecimal(value) : formatInteger(value);
}

interface ChartCardProps {
  title: string;
  description?: string;
  legend?: readonly { key: string; label: string; color: string }[];
  legendShape?: 'box' | 'line';
  /** The same numbers as a table — the text alternative, always one click away. */
  table: ChartTable;
  /** A one-line takeaway shown above the chart ("Bu ay 6 aktif proje"). */
  headline?: ReactNode;
  children: ReactNode;
}

/** A chart with its title, takeaway, legend and a chart/table toggle. */
export function ChartCard({
  title,
  description,
  legend,
  legendShape,
  table,
  headline,
  children,
}: ChartCardProps) {
  const [asTable, setAsTable] = useState(false);
  const columns: TableColumnDef<ChartTable['rows'][number]>[] = table.head.map((header, index) => ({
    id: `c${index}`,
    header,
    accessor: (row) => formatCell(row.cells[index] ?? null, typeOf(table, index)),
    align: index === 0 ? 'start' : 'end',
  }));
  return (
    <SectionCard
      title={title}
      description={description}
      actions={
        <>
          <ExcelExportButton
            title={title}
            disabled={table.rows.length === 0}
            build={() => [
              sheet<ChartTable['rows'][number]>({
                name: title,
                title,
                subtitle: description,
                rows: table.rows,
                columns: table.head.map((header, index) => ({
                  header,
                  value: (row) => row.cells[index] ?? null,
                  type: typeOf(table, index) === 'text' ? 'text' : typeOf(table, index),
                })),
              }),
            ]}
          />
          <Button
            size="small"
            variant="neutral"
            appearance="text"
            aria-pressed={asTable}
            aria-label={`${asTable ? 'Grafik' : 'Tablo'}: ${title}`}
            onClick={() => setAsTable((value) => !value)}
          >
            {asTable ? 'Grafik' : 'Tablo'}
          </Button>
        </>
      }
    >
      <div className="c-chart-card">
        {headline && <p className="c-chart-card__headline">{headline}</p>}
        {legend && !asTable && <ChartLegend items={legend} shape={legendShape} />}
        {asTable ? (
          <Table data={table.rows} columns={columns} getRowId={(row) => row.key} size="small" />
        ) : (
          children
        )}
      </div>
    </SectionCard>
  );
}
