import type { MasterDataVariant } from '../types';

const VARIANT_LABELS: Record<MasterDataVariant, string> = {
  neutral: 'Gri (nötr)',
  info: 'Mavi (bilgi)',
  primary: 'Kırmızı (birincil)',
  secondary: 'Lacivert (ikincil)',
  success: 'Yeşil (olumlu)',
  warning: 'Sarı (uyarı)',
  danger: 'Kırmızı (tehlike)',
  purple: 'Mor',
  cyan: 'Camgöbeği',
  teal: 'Deniz yeşili',
  business: 'Kurumsal',
  dark: 'Koyu',
};

/** Colour choices for coloured lists, labelled by what they look like and signal. */
export const VARIANT_OPTIONS: { value: MasterDataVariant; label: string }[] = (
  Object.keys(VARIANT_LABELS) as MasterDataVariant[]
).map((value) => ({ value, label: VARIANT_LABELS[value] }));
