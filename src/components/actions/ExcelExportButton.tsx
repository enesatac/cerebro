import { Button } from '@takeoff-ui/react-spar';
import { ArrowDownloadIconOutlinedRounded } from '@takeoff-icons/react/arrow-download';
import { useState } from 'react';
import { formatDateTime, toIsoDate } from '@/lib/dates';
import { getErrorMessage } from '@/lib/errors';
import { toaster } from '@/lib/toaster';
import type { SheetSpec } from '@/lib/xlsxTypes';

interface ExcelExportButtonProps {
  /** Workbook title: the file name and the first sheet's heading derive from it. */
  title: string;
  /**
   * Builds the sheets when clicked — may load every page of a paged list, so the file holds all
   * matching records, not just the visible page.
   */
  build: () => SheetSpec[] | Promise<SheetSpec[]>;
  disabled?: boolean;
}

/**
 * "Excel'e aktar": downloads the table as a formatted .xlsx (typed cells, styled frozen header,
 * filters, fitted columns, a context line with filters, row count and export time). The writer
 * loads on demand so it never weighs on page load.
 */
export function ExcelExportButton({ title, build, disabled }: ExcelExportButtonProps) {
  const [pending, setPending] = useState(false);

  const exportWorkbook = async () => {
    setPending(true);
    try {
      const [{ buildWorkbook, downloadWorkbook, workbookFileName }, sheets] = await Promise.all([
        import('@/lib/xlsx'),
        build(),
      ]);
      const now = new Date();
      const stamped = sheets.map((spec) => ({
        ...spec,
        subtitle: [
          spec.subtitle,
          `${spec.rows.length} kayıt`,
          `Cerebro, ${formatDateTime(now.toISOString())}`,
        ]
          .filter(Boolean)
          .join(' · '),
      }));
      downloadWorkbook(buildWorkbook(stamped, { title }), workbookFileName(title, toIsoDate(now)));
      toaster.success({ title: 'Excel dosyası indirildi', description: title });
    } catch (error) {
      toaster.error({ title: 'Excel dosyası oluşturulamadı', description: getErrorMessage(error) });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      size="small"
      variant="neutral"
      appearance="outlined"
      startContent={<ArrowDownloadIconOutlinedRounded aria-hidden="true" />}
      loading={pending}
      disabled={disabled || pending}
      aria-label={`Excel'e aktar: ${title}`}
      onClick={() => void exportWorkbook()}
    >
      Excel'e aktar
    </Button>
  );
}
