import type { SheetSpec } from '@/lib/xlsxTypes';
import { ExcelExportButton } from './ExcelExportButton';

interface TableExportBarProps {
  title: string;
  build: () => SheetSpec[] | Promise<SheetSpec[]>;
  disabled?: boolean;
}

/** The export action, right-aligned above a table that has no page header of its own. */
export function TableExportBar({ title, build, disabled }: TableExportBarProps) {
  return (
    <div className="c-table-tools">
      <ExcelExportButton title={title} build={build} disabled={disabled} />
    </div>
  );
}
