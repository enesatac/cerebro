import { TakeoffSparProvider, Toaster, type ColorMode } from '@takeoff-ui/react-spar';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toaster } from '@/lib/toaster';
import { RepositoryProvider } from '@/services/RepositoryContext';
import { ThemeContext } from '../theme/ThemeContext';
import { readStoredColorMode, storeColorMode, systemColorMode } from '../theme/themePreference';
import type { Repositories } from '@/services/repositories';

interface AppProvidersProps {
  queryClient: QueryClient;
  repositories: Repositories;
  children: ReactNode;
}

/** Everything the UI needs from its environment. Tests use the same providers with test doubles. */
export function AppProviders({ queryClient, repositories, children }: AppProvidersProps) {
  const [chosen, setChosen] = useState<ColorMode | null>(readStoredColorMode);
  const [system, setSystem] = useState<ColorMode>(systemColorMode);

  // Without an explicit choice, follow the operating system as it changes (e.g. at sunset).
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const theme = useMemo(
    () => ({
      mode: chosen ?? system,
      setMode: (mode: ColorMode) => {
        storeColorMode(mode);
        setChosen(mode);
      },
    }),
    [chosen, system],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <TakeoffSparProvider
        colorMode={theme.mode}
        locale="tr"
        // App-wide density: Cerebro is an information-dense tool used daily.
        components={{ Table: { defaultProps: { size: 'small' } } }}
      >
        <QueryClientProvider client={queryClient}>
          <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>
          <Toaster toaster={toaster} appearance="outlined" />
        </QueryClientProvider>
      </TakeoffSparProvider>
    </ThemeContext.Provider>
  );
}
