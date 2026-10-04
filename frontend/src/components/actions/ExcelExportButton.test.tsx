import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { strFromU8, unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as Xlsx from '@/lib/xlsx';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

const downloads = vi.hoisted(() => [] as { bytes: Uint8Array; fileName: string }[]);
vi.mock('@/lib/xlsx', async (importOriginal) => ({
  ...(await importOriginal<typeof Xlsx>()),
  downloadWorkbook: (bytes: Uint8Array, fileName: string) => downloads.push({ bytes, fileName }),
}));

const sheetXml = (index = 1) => {
  const download = downloads.at(-1);
  if (!download) throw new Error('nothing downloaded');
  return strFromU8(unzipSync(download.bytes)[`xl/worksheets/sheet${index}.xml`] as Uint8Array);
};

afterEach(() => {
  downloads.length = 0;
});

describe('Excel export', () => {
  it('exports every matching application, not just the visible page, with readable labels', async () => {
    const user = userEvent.setup();
    renderRoute('/applications?size=10&lifecycle=active');
    await screen.findByRole('link', { name: 'Ödeme Geçidi' });
    await user.click(screen.getByRole('button', { name: "Excel'e aktar: Uygulamalar" }));
    await waitFor(() => expect(downloads).toHaveLength(1));

    expect(downloads[0]?.fileName).toMatch(/^uygulamalar-\d{4}-\d{2}-\d{2}\.xlsx$/);
    const xml = sheetXml();
    // 12 active applications, page size 10: all of them are in the file.
    expect(xml.match(/<row r="\d+"/g)?.length).toBe(1 + 1 + 1 + 12);
    expect(xml).toContain('Filtreler: Yaşam döngüsü: Aktif');
    expect(xml).toContain('>Aktif<');
    expect(xml).not.toContain('>active<');
    expect(await screen.findByText('Excel dosyası indirildi')).toBeInTheDocument();
  });

  it('is available to read-only users too, and exports a register with resolved names', async () => {
    const user = userEvent.setup();
    renderRoute('/risks?tab=risks', createMockRepositories({ signedInAs: TEST_VIEWER }));
    await user.click(await screen.findByRole('button', { name: "Excel'e aktar: Riskler" }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    const xml = sheetXml();
    expect(xml).toContain('Ödeme Geçidi');
    expect(xml).toContain('Etkilenen uygulamalar');
  });

  it('writes one sheet per table when a page holds several', async () => {
    const user = userEvent.setup();
    renderRoute('/people/24');
    await user.click(
      await screen.findByRole('button', { name: "Excel'e aktar: Zeynep Çelik — iş özeti" }),
    );
    await waitFor(() => expect(downloads).toHaveLength(1));
    const files = unzipSync(downloads[0]?.bytes ?? new Uint8Array());
    const workbook = strFromU8(files['xl/workbook.xml'] as Uint8Array);
    for (const name of [
      'Özet',
      'Uygulamalar',
      'Projeler',
      'Eskalasyonlar',
      'Riskler',
      'Kararlar',
      'Kaynak planı',
      'İzinler',
    ]) {
      expect(workbook).toContain(`name="${name}"`);
    }
  });
});
