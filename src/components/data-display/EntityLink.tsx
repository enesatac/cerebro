import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface EntityLinkProps {
  /** Destination; when omitted (no detail page yet) the name renders as plain text. */
  to?: string | null;
  children: ReactNode;
}

/** Link to another Cerebro entity so the product feels connected. */
export function EntityLink({ to, children }: EntityLinkProps) {
  return to ? (
    <Link to={to} className="c-link">
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  );
}
