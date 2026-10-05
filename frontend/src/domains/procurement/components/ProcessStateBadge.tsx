import type { BadgeVariant } from '@takeoff-ui/react-spar';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { PROCESS_STATE_LABELS, type ProcessState } from '../utils/processState';

const VARIANTS: Record<ProcessState, BadgeVariant> = {
  undefined: 'neutral',
  'not-started': 'neutral',
  'in-progress': 'info',
  late: 'warning',
  blocked: 'danger',
  completed: 'success',
};

/** Where a purchase stands (derived from its steps), always with its label. */
export function ProcessStateBadge({ state }: { state: ProcessState }) {
  return (
    <StatusBadge
      label={PROCESS_STATE_LABELS[state]}
      variant={VARIANTS[state]}
      context="Süreç durumu:"
    />
  );
}
