import { describe, expect, it } from 'vitest';
import {
  extensionOf,
  formatFileSize,
  isAllowedFileName,
  isPreviewable,
  sanitizeFileName,
} from './attachmentFiles';

describe('attachment files', () => {
  it('accepts documents and images, refuses executables, scripts and SVG', () => {
    expect(
      ['Mimari.PDF', 'rapor.docx', 'plan.xlsx', 'ekran.png', 'şema.drawio'].every(
        isAllowedFileName,
      ),
    ).toBe(true);
    expect(
      ['setup.exe', 'run.sh', 'logo.svg', 'page.html', 'noext', 'a.pdf.exe'].some(
        isAllowedFileName,
      ),
    ).toBe(false);
    expect(extensionOf('arşiv.tar.ZIP')).toBe('zip');
  });

  it('cleans names without losing Turkish letters', () => {
    expect(sanitizeFileName('C:\\Users\\x\\Güvenlik  Değerlendirmesi?.pdf')).toBe(
      'Güvenlik Değerlendirmesi.pdf',
    );
    expect(sanitizeFileName('../../etc/passwd.txt')).toBe('passwd.txt');
  });

  it('formats sizes and knows what can be previewed', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1,5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    expect(isPreviewable('application/pdf')).toBe(true);
    expect(isPreviewable('image/svg+xml')).toBe(false);
  });
});
