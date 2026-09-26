import { Badge, type BadgeVariant } from '@takeoff-ui/react-spar';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  /** Visually hidden prefix for screen readers, e.g. "Lifecycle:". */
  context?: string;
}

/** Status pill with the label always visible — colour is never the only signal. */
export function StatusBadge({ label, variant, context }: StatusBadgeProps) {
  return (
    <Badge variant={variant} appearance="filledLight" size="small">
      {context && <span className="c-visually-hidden">{context} </span>}
      {label}
    </Badge>
  );
}
