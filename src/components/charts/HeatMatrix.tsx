interface HeatMatrixProps {
  /** Row labels, top to bottom (e.g. probability high → low). */
  rows: readonly { key: string; label: string }[];
  /** Column labels, left to right (e.g. impact low → high). */
  columns: readonly { key: string; label: string }[];
  value: (row: string, column: string) => number;
  rowTitle: string;
  columnTitle: string;
  caption: string;
  /** Severity of a cell 0–3 (diagonal bands of a risk matrix), drives the background. */
  band: (rowIndex: number, columnIndex: number) => number;
}

/**
 * A small count matrix (e.g. risks by probability × impact). It is a real table — row and column
 * headers for screen readers — whose cells are tinted by severity band; counts are printed in
 * every cell because the matrix is small and the count is the point.
 */
export function HeatMatrix({
  rows,
  columns,
  value,
  rowTitle,
  columnTitle,
  caption,
  band,
}: HeatMatrixProps) {
  return (
    <div className="c-heat">
      <table className="c-heat__table">
        <caption className="c-visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="c-heat__corner">
              {rowTitle} ↓ · {columnTitle} →
            </th>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              {columns.map((column, columnIndex) => {
                const count = value(row.key, column.key);
                return (
                  <td
                    key={column.key}
                    className={`c-heat__cell c-heat__cell--b${band(rowIndex, columnIndex)}${count === 0 ? ' c-heat__cell--empty' : ''}`}
                    title={`${rowTitle}: ${row.label} · ${columnTitle}: ${column.label} · ${count} risk`}
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
