import { Skeleton } from '@takeoff-ui/react-spar';

interface LoadingStateProps {
  /** Announced to assistive technology; skeletons themselves are aria-hidden. */
  label?: string;
  rows?: number;
}

export function LoadingState({ label = 'Loading', rows = 4 }: LoadingStateProps) {
  return (
    <div className="c-loading-state" role="status" aria-live="polite">
      <span className="c-visually-hidden">{label}…</span>
      <Skeleton height={28} width="40%" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={16} width={index % 2 === 0 ? '100%' : '85%'} />
      ))}
    </div>
  );
}
