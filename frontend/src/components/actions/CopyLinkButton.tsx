import { Button } from '@takeoff-ui/react-spar';
import { useEffect, useState } from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

const LABELS: Record<CopyState, string> = {
  idle: 'Bağlantıyı kopyala',
  copied: 'Bağlantı kopyalandı',
  failed: 'Kopyalanamadı',
};

/** Copies the current page URL so users can share a deep link. */
export function CopyLinkButton() {
  const [state, setState] = useState<CopyState>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <Button variant="neutral" appearance="outlined" onClick={() => void copy()} aria-live="polite">
      {LABELS[state]}
    </Button>
  );
}
