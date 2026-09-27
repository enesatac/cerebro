import type { ColorMode } from '@takeoff-ui/react-spar';

/**
 * The colour mode the user picked, kept per browser. Without a stored choice the operating
 * system preference applies. Storage can be unavailable (private mode) — every access is guarded.
 * `index.html` reads the same key before the app loads to avoid a light flash on dark screens.
 */
export const THEME_STORAGE_KEY = 'cerebro.theme';

const isColorMode = (value: unknown): value is ColorMode => value === 'light' || value === 'dark';

export function readStoredColorMode(): ColorMode | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isColorMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeColorMode(mode: ColorMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // The choice then lasts for this session only.
  }
}

export function systemColorMode(): ColorMode {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
