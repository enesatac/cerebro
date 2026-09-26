import { useSearchParams } from 'react-router';
import { oneOf } from '@/lib/urlParams';

/**
 * Active tab synced to `?tab=` so tabs are deep-linkable. The first id is the default and is
 * omitted from the URL. Invalid values fall back to the default.
 */
export function useTabParam<T extends string>(tabIds: readonly T[]): [T, (tab: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = tabIds[0];
  if (fallback === undefined) throw new Error('useTabParam requires at least one tab id.');
  const active = oneOf(tabIds, searchParams.get('tab')) ?? fallback;

  const select = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === fallback) next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };
  return [active, select];
}
