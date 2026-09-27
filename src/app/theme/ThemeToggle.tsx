import { Button } from '@takeoff-ui/react-spar';
import { MoonIconOutlinedRounded } from '@takeoff-icons/react/moon';
import { SunIconOutlinedRounded } from '@takeoff-icons/react/sun';
import { useColorMode } from './ThemeContext';

/** Switches between light and dark mode; the choice is remembered in this browser. */
export function ThemeToggle() {
  const { mode, setMode } = useColorMode();
  const dark = mode === 'dark';
  return (
    <Button
      variant="neutral"
      appearance="text"
      size="small"
      startContent={
        dark ? (
          <SunIconOutlinedRounded aria-hidden="true" />
        ) : (
          <MoonIconOutlinedRounded aria-hidden="true" />
        )
      }
      aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-pressed={dark}
      onClick={() => setMode(dark ? 'light' : 'dark')}
    />
  );
}
