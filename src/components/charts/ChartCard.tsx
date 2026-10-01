import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useState, type ReactNode } from 'react';
import { SectionCard } from '@/components/layout/SectionCard';
import { ChartLegend } from './ChartLegend';

export interface ChartTable {
  head: string[];
  rows: { key: string; cells: (string | number)[] }[];
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
    accessor: (row) => row.cells[index] ?? '',
    align: index === 0 ? 'start' : 'end',
  }));
  return (
    <SectionCard
      title={title}
      description={description}
      actions={
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
