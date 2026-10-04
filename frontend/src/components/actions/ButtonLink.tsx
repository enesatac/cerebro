import {
  Button,
  type ButtonAppearance,
  type ButtonSize,
  type ButtonVariant,
} from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  startContent?: ReactNode;
}

/**
 * Navigation styled as a Takeoff button.
 *
 * `@takeoff-ui/react-spar@0.6.0` sets `role="button"` on `<Button as={Link}>`, which makes screen
 * readers announce a link as a button. We restore the link role here (an instance `role` wins over
 * the library default). Remove the override once Takeoff renders anchors with their native role.
 */
export function ButtonLink({ to, children, ...buttonProps }: ButtonLinkProps) {
  return (
    <Button as={Link} to={to} role="link" {...buttonProps}>
      {children}
    </Button>
  );
}
