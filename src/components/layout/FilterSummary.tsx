import { Button } from '@takeoff-ui/react-spar';

interface FilterSummaryProps {
  /** e.g. "12 applications"; empty while the first result is loading. */
  summary: string;
  activeFilterCount: number;
  onReset: () => void;
}

/** Toolbar end slot: live result count plus a reset action while filters are active. */
export function FilterSummary({ summary, activeFilterCount, onReset }: FilterSummaryProps) {
  return (
    <>
      <span className="c-muted" aria-live="polite">
        {summary}
      </span>
      {activeFilterCount > 0 && (
        <Button size="small" appearance="text" variant="neutral" onClick={onReset}>
          Clear filters ({activeFilterCount})
        </Button>
      )}
    </>
  );
}
