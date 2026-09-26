import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { ReviewState } from './staleness';

export function reviewStatePresentation(state: ReviewState): StatusPresentation {
  switch (state.kind) {
    case 'never-reviewed':
      return { label: 'Hiç gözden geçirilmedi', variant: 'danger' };
    case 'stale':
      return { label: `Gecikmiş · ${state.daysSinceReview} gün`, variant: 'warning' };
    case 'current':
      return { label: `Güncel · ${state.daysSinceReview} gün`, variant: 'success' };
  }
}

export function reviewStateLabel(state: ReviewState): string {
  return reviewStatePresentation(state).label;
}
