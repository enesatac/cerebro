/**
 * A small, valid one-page PDF for seed attachments (they have metadata but no uploaded bytes).
 * The base-14 Helvetica font only covers WinAnsi, so Turkish letters outside it are transliterated.
 */
const TRANSLITERATE: Record<string, string> = {
  ğ: 'g',
  Ğ: 'G',
  ı: 'i',
  İ: 'I',
  ş: 's',
  Ş: 'S',
};

const pdfText = (value: string) =>
  value
    .replace(/[ğĞıİşŞ]/g, (char) => TRANSLITERATE[char] ?? char)
    .replace(/[^ -~À-ÿ]/g, '')
    .replace(/[\\()]/g, (char) => `\\${char}`);

export function samplePdf(title: string, lines: readonly string[]): Blob {
  const text = [
    'BT /F1 20 Tf 56 770 Td',
    `(${pdfText(title)}) Tj`,
    '/F1 11 Tf 0 -28 Td',
    ...lines.flatMap((line) => [`(${pdfText(line)}) Tj`, '0 -16 Td']),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Latin-1 bytes, so offsets above (counted in characters) match the byte positions.
  const bytes = Uint8Array.from(body, (char) => char.charCodeAt(0) & 0xff);
  return new Blob([bytes], { type: 'application/pdf' });
}
