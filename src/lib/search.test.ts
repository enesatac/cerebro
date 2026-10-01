import { describe, expect, it } from 'vitest';
import { foldForSearch, includesFolded } from './search';

describe('search folding', () => {
  it('matches across Turkish and English casing of I', () => {
    expect(includesFolded('PROVIDER_TIMEOUT', 'timeout')).toBe(true);
    expect(includesFolded('Işık', 'ISIK')).toBe(true);
    expect(includesFolded('SERTİFİKA', 'sertifika')).toBe(true);
  });

  it('ignores accents so plain keyboards still find Turkish names', () => {
    expect(includesFolded('Zeynep Çelik', 'celik')).toBe(true);
    expect(foldForSearch(' Ödeme Geçidi ')).toBe('odeme gecidi');
  });

  it('treats an empty query as a match', () => {
    expect(includesFolded('anything', '  ')).toBe(true);
  });
});
