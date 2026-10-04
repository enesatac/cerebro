import type { ColorMode } from '@takeoff-ui/react-spar';
import { createContext, useContext } from 'react';

export interface ThemeState {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);

export function useColorMode(): ThemeState {
  const state = useContext(ThemeContext);
  if (!state) throw new Error('useColorMode must be used inside <AppProviders>.');
  return state;
}
