import type { BadgeVariant } from '@takeoff-ui/react-spar';

/**
 * Label + Takeoff Badge variant for an application-internal value (roles, account status). Values
 * administrators manage live in master data instead (`domains/master-data`).
 */
export interface StatusPresentation {
  label: string;
  variant: BadgeVariant;
}
