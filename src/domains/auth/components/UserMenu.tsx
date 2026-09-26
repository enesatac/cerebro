import { Badge, Button, Dropdown } from '@takeoff-ui/react-spar';
import { ChevronBottomIconOutlinedRounded } from '@takeoff-icons/react/chevron-bottom';
import { useNavigate } from 'react-router';
import { paths } from '@/app/router/paths';
import { useCurrentUser, useSignOut } from '../api/queries';
import { hasPermission } from '../utils/permissions';
import { ROLE_PRESENTATION } from '../utils/rolePresentation';

export function UserMenu() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <Dropdown>
      <Dropdown.Trigger
        as={Button}
        variant="neutral"
        appearance="text"
        size="small"
        endContent={<ChevronBottomIconOutlinedRounded aria-hidden="true" />}
        aria-label={`Account menu for ${user.displayName}, ${ROLE_PRESENTATION[user.role].label}`}
      >
        <span className="c-user-menu__name">{user.displayName}</span>
        <Badge variant={ROLE_PRESENTATION[user.role].variant} appearance="filledLight" size="small">
          {ROLE_PRESENTATION[user.role].label}
        </Badge>
      </Dropdown.Trigger>
      <Dropdown.Content align="end">
        <Dropdown.Label>{user.email}</Dropdown.Label>
        <Dropdown.Separator />
        {hasPermission(user, 'users:manage') && (
          <Dropdown.Item onSelect={() => void navigate(paths.admin.users())}>
            Manage users
          </Dropdown.Item>
        )}
        <Dropdown.Item
          onSelect={() =>
            signOut.mutate(undefined, {
              onSuccess: () => void navigate(paths.signIn(), { replace: true }),
            })
          }
        >
          Sign out
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown>
  );
}
