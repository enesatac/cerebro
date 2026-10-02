import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildWorkbook, columnLetter, excelDate, sheet, workbookFileName } from './xlsx';

interface Row {
  name: string;
  date: string;
  count: number;
  share: number;
  url: string;
}

const rows: Row[] = [
  {
    name: 'Ödeme Geçidi <PAYGW>',
    date: '2026-10-02',
    count: 1200,
    share: 45,
    url: 'https://x.example/a?b=1&c=2',
  },
  { name: '=HYPERLINK("http://evil")', date: '', count: 2.5, share: 0, url: 'not a url' },
];

const workbook = () =>
  unzipSync(
    buildWorkbook(
      [
        sheet<Row>({
          name: 'Uygulamalar: liste/1',
          title: 'Uygulamalar',
          subtitle: 'Filtre: Aktif',
          columns: [
            { header: 'Ad', value: (r) => r.name },
            { header: 'Tarih', value: (r) => r.date, type: 'date' },
            { header: 'Sayı', value: (r) => r.count, type: 'integer' },
            { header: 'Pay', value: (r) => r.share, type: 'percent' },
            { header: 'Adres', value: (r) => r.url, type: 'link' },
          ],
          rows,
        }),
      ],
      { title: 'Uygulamalar' },
    ),
  );

describe('xlsx writer', () => {
  it('packages a valid workbook with styles, a sanitised sheet name and the core parts', () => {
    const files = workbook();
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        '[Content_Types].xml',
        '_rels/.rels',
        'xl/workbook.xml',
        'xl/styles.xml',
        'xl/worksheets/sheet1.xml',
        'xl/worksheets/_rels/sheet1.xml.rels',
      ]),
    );
    expect(strFromU8(files['xl/workbook.xml'] as Uint8Array)).toContain(
      'name="Uygulamalar  liste 1"',
    );
  });

  it('writes typed cells, escapes text and never writes formulas', () => {
    const xml = strFromU8(workbook()['xl/worksheets/sheet1.xml'] as Uint8Array);
    expect(xml).toContain('Ödeme Geçidi &lt;PAYGW&gt;');
    expect(xml).toContain(`<v>${excelDate('2026-10-02')}</v>`);
    expect(xml).toContain('<v>1200</v>');
    expect(xml).toContain('<v>0.45</v>');
    expect(xml).not.toContain('<f>');
    expect(xml).toContain('=HYPERLINK(&quot;http://evil&quot;)</t>');
    expect(xml).toContain('<pane ySplit="4"');
    expect(xml).toContain('<autoFilter ref="A4:E6"/>');
    const rels = strFromU8(workbook()['xl/worksheets/_rels/sheet1.xml.rels'] as Uint8Array);
    expect(rels).toContain('Target="https://x.example/a?b=1&amp;c=2"');
    expect(rels).not.toContain('not a url');
  });

  it('converts dates, columns and file names', () => {
    expect(excelDate('1900-01-01')).toBe(2);
    expect(excelDate('2026-10-02')).toBe(46297);
    expect(excelDate('soon')).toBeNull();
    expect([0, 25, 26, 701].map(columnLetter)).toEqual(['A', 'Z', 'AA', 'ZZ']);
    expect(workbookFileName('İzin takvimi — Eylül', '2026-10-02')).toBe(
      'izin-takvimi-eylul-2026-10-02.xlsx',
    );
  });
});
