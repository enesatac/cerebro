import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';

/**
 * Blocks in-app navigation (and warns on tab close) while `dirty`. Returns the router blocker so
 * the caller can render a confirmation, plus `allowNavigation()` to call right before navigating
 * away after a successful save.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const dirtyRef = useRef(dirty);
  const bypassRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypassRef.current &&
      dirtyRef.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const allowNavigation = useCallback(() => {
    bypassRef.current = true;
  }, []);

  return { blocker, allowNavigation };
}
