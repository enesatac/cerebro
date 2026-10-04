/**
 * Folds text for "contains" searches so people find what they mean regardless of how they type:
 * case-insensitive (Turkish I/İ/ı/i all match — "TIMEOUT" lower-cases to "tımeout" in Turkish),
 * and accents dropped (ç, ğ, ö, ş, ü match c, g, o, s, u) for keyboards without them.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .trim();
}

/** True when `text` contains the folded `query` (an empty query matches everything). */
export function includesFolded(text: string, query: string): boolean {
  const needle = foldForSearch(query);
  return needle === '' || foldForSearch(text).includes(needle);
}
