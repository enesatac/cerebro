import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** A relevant next step, e.g. "Add repository" or "Clear filters". */
  action?: ReactNode;
  /** Tighter spacing when rendered inside a card or table. */
  compact?: boolean;
}

export function EmptyState({ title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`c-empty-state${compact ? ' c-empty-state--compact' : ''}`}>
      <p className="c-empty-state__title">{title}</p>
      {description && <p className="c-empty-state__description">{description}</p>}
      {action && <div className="c-empty-state__action">{action}</div>}
    </div>
  );
}
