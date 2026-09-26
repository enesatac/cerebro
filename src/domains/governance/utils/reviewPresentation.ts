import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { ReviewState } from './staleness';

export function reviewStatePresentation(state: ReviewState): StatusPresentation {
  switch (state.kind) {
    case 'never-reviewed':
      return { label: 'Never reviewed', variant: 'danger' };
    case 'stale':
      return { label: `Overdue · ${state.daysSinceReview} days`, variant: 'warning' };
    case 'current':
      return { label: `Current · ${state.daysSinceReview} days`, variant: 'success' };
  }
}

export function reviewStateLabel(state: ReviewState): string {
  return reviewStatePresentation(state).label;
}
