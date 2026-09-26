import { OpenIconOutlinedRounded } from '@takeoff-icons/react/open';
import type { ReactNode } from 'react';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
}

/** Link that leaves Cerebro: new tab, no opener, announced to screen readers. */
export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="c-link c-external-link">
      {children}
      <OpenIconOutlinedRounded className="c-external-link__icon" aria-hidden="true" />
      <span className="c-visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
