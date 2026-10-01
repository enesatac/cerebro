import type { BadgeVariant } from '@takeoff-ui/react-spar';
import type { LoadLevel } from './resourcePlan';

/**
 * Load bands are computed from percentages (not stored codes), so their wording and colour live
 * here rather than in master data — the one place to change them.
 */
export const LOAD_PRESENTATION: Record<LoadLevel, { label: string; variant: BadgeVariant }> = {
  free: { label: 'Boşta', variant: 'neutral' },
  partial: { label: 'Kapasitesi var', variant: 'success' },
  full: { label: 'Tam dolu', variant: 'info' },
  over: { label: 'Aşırı yük', variant: 'danger' },
};

/** "2 iş · %90" — parallel count first, the thing people ask about. */
export function describeLoad(count: number, percent: number): string {
  if (count === 0) return 'İş yok';
  return `${count} iş · %${percent}`;
}
