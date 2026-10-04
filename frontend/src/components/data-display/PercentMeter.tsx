import { Progress } from '@takeoff-ui/react-spar';

interface PercentMeterProps {
  value: number;
  /** What is being measured, for the accessible name, e.g. "Payment Gateway completeness". */
  label: string;
}

/** Compact Takeoff progress bar with the percentage always visible as text. */
export function PercentMeter({ value, label }: PercentMeterProps) {
  return (
    <span className="c-progress-inline">
      <Progress value={value} size="small" aria-label={`${label}: ${value}%`} />
      <span className="c-progress-inline__value">{value}%</span>
    </span>
  );
}
