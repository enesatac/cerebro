import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  const columns = [
    { header: 'Name', value: (row: { name: string; n: number | null }) => row.name },
    { header: 'Count', value: (row: { name: string; n: number | null }) => row.n },
  ];

  it('writes a header row and CRLF-separated records', () => {
    expect(toCsv([{ name: 'A', n: 1 }], columns)).toBe('Name,Count\r\nA,1');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([{ name: 'a, "b"\nc', n: null }], columns)).toBe('Name,Count\r\n"a, ""b""\nc",');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(toCsv([{ name: '=HYPERLINK("x")', n: 0 }], columns)).toBe(
      `Name,Count\r\n"'=HYPERLINK(""x"")",0`,
    );
  });
});
