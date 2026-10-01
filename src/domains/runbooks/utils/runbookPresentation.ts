import { foldForSearch } from '@/lib/search';
import type { BadgeVariant } from '@takeoff-ui/react-spar';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { IsoDate } from '@/domains/shared/types';
import type { RunbookScenario } from '../types';

/** A runbook nobody has walked through for this long may describe a system that has changed. */
export const RUNBOOK_STALE_DAYS = 180;

export type VerificationState = 'never' | 'stale' | 'fresh';

export function verificationState(
  lastVerifiedOn: IsoDate | null,
  today: IsoDate,
): VerificationState {
  if (!lastVerifiedOn) return 'never';
  return differenceInCalendarDays(parseISO(today), parseISO(lastVerifiedOn)) > RUNBOOK_STALE_DAYS
    ? 'stale'
    : 'fresh';
}

export const VERIFICATION_PRESENTATION: Record<
  VerificationState,
  { label: string; variant: BadgeVariant }
> = {
  never: { label: 'Hiç doğrulanmadı', variant: 'warning' },
  stale: { label: '6 aydan uzun süredir doğrulanmadı', variant: 'warning' },
  fresh: { label: 'Güncel', variant: 'success' },
};

const normalise = foldForSearch;

/** Known problems whose title, symptoms or steps mention every word of the query. */
export function matchScenarios(
  scenarios: readonly RunbookScenario[],
  query: string,
): RunbookScenario[] {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...scenarios];
  return scenarios.filter((scenario) => {
    const haystack = normalise(
      [scenario.title, scenario.symptoms, ...scenario.steps.map((s) => s.text)].join(' '),
    );
    return words.every((word) => haystack.includes(word));
  });
}
