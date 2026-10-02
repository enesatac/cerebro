import { strToU8, zipSync } from 'fflate';
import { downloadBlob } from './download';

/**
 * A small Office Open XML (.xlsx) writer: one workbook, one or more sheets, real typed cells
 * (numbers, dates, percentages), a styled and frozen header row with an auto-filter, column widths
 * fitted to the content, and clickable links. No formulas are ever written: every text value is
 * an inline string, so spreadsheet formula injection is impossible.
 */

import type { CellValue, ColumnType, SheetSpec } from './xlsxTypes';

export { sheet } from './xlsxTypes';
export type { CellValue, ColumnType, SheetColumn, SheetSpec } from './xlsxTypes';

// ---------- styles (cellXfs indexes) ----------
const STYLE = {
  text: 0,
  header: 1,
  date: 2,
  integer: 3,
  decimal: 4,
  percent: 5,
  title: 6,
  subtitle: 7,
  link: 8,
} as const;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="dd.mm.yyyy"/><numFmt numFmtId="165" formatCode="#,##0.0"/></numFmts>
<fonts count="5">
<font><sz val="11"/><color rgb="FF1F2937"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="15"/><color rgb="FF111827"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="10"/><color rgb="FF6B7280"/><name val="Calibri"/><family val="2"/></font>
<font><u/><sz val="11"/><color rgb="FF1D4ED8"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFE5E7EB"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="top" horizontal="left"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="top"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="top"/></xf>
<xf numFmtId="9" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Rows before the header: title, subtitle, blank. */
const HEADER_ROW = 4;

function escapeXml(value: string): string {
  return (
    value
      // Characters XML 1.0 cannot carry at all.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  );
}

/** A → 1, Z → 26, AA → 27 … */
export function columnLetter(index: number): string {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/** Excel stores dates as days since 1899-12-30. */
export function excelDate(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return utc / 86_400_000 + 25_569;
}

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

function cellXml(ref: string, value: CellValue, type: ColumnType): string {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'date' && typeof value === 'string') {
    const serial = excelDate(value);
    if (serial !== null) return `<c r="${ref}" s="${STYLE.date}"><v>${serial}</v></c>`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (type === 'percent') return `<c r="${ref}" s="${STYLE.percent}"><v>${value / 100}</v></c>`;
    const style = type === 'decimal' || !Number.isInteger(value) ? STYLE.decimal : STYLE.integer;
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="inlineStr" s="${STYLE.text}"><is><t>${value ? 'Evet' : 'Hayır'}</t></is></c>`;
  }
  const text = escapeXml(String(value));
  const style = type === 'link' && isHttpUrl(String(value)) ? STYLE.link : STYLE.text;
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${text}</t></is></c>`;
}

const displayLength = (value: CellValue, type: ColumnType) => {
  if (value === null || value === undefined) return 0;
  if (type === 'date') return 10;
  const text = String(value);
  // Wrapped text: the longest line decides the width.
  return Math.max(...text.split('\n').map((line) => line.length));
};

function sheetXml(spec: SheetSpec): { xml: string; links: { ref: string; url: string }[] } {
  const columns = spec.columns;
  const types = columns.map((c) => c.type ?? 'text');
  const values = spec.rows.map((row) => columns.map((c) => c.value(row)));
  const widths = columns.map((column, index) => {
    if (column.width) return column.width;
    const longest = Math.max(
      column.header.length + 2,
      ...values.slice(0, 500).map((row) => displayLength(row[index], types[index] ?? 'text')),
    );
    return Math.min(60, Math.max(9, longest + 2));
  });
  const lastColumn = columnLetter(Math.max(0, columns.length - 1));
  const lastRow = HEADER_ROW + values.length;
  const links: { ref: string; url: string }[] = [];

  const rows: string[] = [
    `<row r="1" ht="24" customHeight="1"><c r="A1" t="inlineStr" s="${STYLE.title}"><is><t>${escapeXml(spec.title)}</t></is></c></row>`,
  ];
  if (spec.subtitle) {
    rows.push(
      `<row r="2"><c r="A2" t="inlineStr" s="${STYLE.subtitle}"><is><t xml:space="preserve">${escapeXml(spec.subtitle)}</t></is></c></row>`,
    );
  }
  rows.push(
    `<row r="${HEADER_ROW}" ht="22" customHeight="1">${columns
      .map(
        (column, index) =>
          `<c r="${columnLetter(index)}${HEADER_ROW}" t="inlineStr" s="${STYLE.header}"><is><t>${escapeXml(column.header)}</t></is></c>`,
      )
      .join('')}</row>`,
  );
  values.forEach((row, rowIndex) => {
    const r = HEADER_ROW + 1 + rowIndex;
    const cells = row
      .map((value, index) => {
        const ref = `${columnLetter(index)}${r}`;
        const type = types[index] ?? 'text';
        if (type === 'link' && typeof value === 'string' && isHttpUrl(value)) {
          links.push({ ref, url: value });
        }
        return cellXml(ref, value, type);
      })
      .join('');
    rows.push(`<row r="${r}">${cells}</row>`);
  });

  const hyperlinks = links.length
    ? `<hyperlinks>${links
        .map((link, index) => `<hyperlink ref="${link.ref}" r:id="rId${index + 1}"/>`)
        .join('')}</hyperlinks>`
    : '';

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="A1:${lastColumn}${Math.max(lastRow, HEADER_ROW)}"/>
<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${HEADER_ROW}" topLeftCell="A${HEADER_ROW + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="16"/>
<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${rows.join('')}</sheetData>
${values.length ? `<autoFilter ref="A${HEADER_ROW}:${lastColumn}${lastRow}"/>` : ''}
${hyperlinks}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
  return { xml, links };
}

/** Sheet names must be unique, ≤ 31 characters and free of `[]:*?/\`. */
function sheetNames(specs: readonly SheetSpec[]): string[] {
  const used = new Set<string>();
  return specs.map((spec) => {
    const base =
      spec.name
        .replace(/[[\]:*?/\\]/g, ' ')
        .trim()
        .slice(0, 31) || 'Sayfa';
    let name = base;
    for (let n = 2; used.has(name.toLowerCase()); n += 1) {
      name = `${base.slice(0, 31 - String(n).length - 1)} ${n}`;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

/** Builds the .xlsx file bytes. */
export function buildWorkbook(specs: readonly SheetSpec[], meta: { title: string }): Uint8Array {
  const names = sheetNames(specs);
  const files: Record<string, Uint8Array> = {};
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  files['[Content_Types].xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`);

  files['_rels/.rels'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  files['docProps/core.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${escapeXml(meta.title)}</dc:title><dc:creator>Cerebro</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
</cp:coreProperties>`);
  files['docProps/app.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Cerebro</Application></Properties>`);

  files['xl/workbook.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${names.map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
<definedNames>${specs
    .map((spec, i) =>
      spec.rows.length
        ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escapeXml(names[i] ?? '').replace(/'/g, "''")}'!$A$${HEADER_ROW}:$${columnLetter(Math.max(0, spec.columns.length - 1))}$${HEADER_ROW + spec.rows.length}</definedName>`
        : '',
    )
    .join('')}</definedNames>
</workbook>`);

  files['xl/_rels/workbook.xml.rels'] =
    strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  files['xl/styles.xml'] = strToU8(STYLES_XML);

  specs.forEach((spec, i) => {
    const { xml, links } = sheetXml(spec);
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(xml);
    if (links.length) {
      files[`xl/worksheets/_rels/sheet${i + 1}.xml.rels`] =
        strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${links.map((link, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(link.url)}" TargetMode="External"/>`).join('\n')}
</Relationships>`);
    }
  });

  return zipSync(files, { level: 6 });
}

/** `Uygulamalar` + today → `uygulamalar-2026-10-02.xlsx` (ASCII, no spaces). */
export function workbookFileName(title: string, today: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'cerebro'}-${today}.xlsx`;
}

/** Saves the workbook through a temporary download link. */
export function downloadWorkbook(bytes: Uint8Array, fileName: string): void {
  downloadBlob(
    new Blob([bytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
