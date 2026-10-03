import { Badge, Button, Dropdown } from '@takeoff-ui/react-spar';
import { ChevronBottomIconOutlinedRounded } from '@takeoff-icons/react/chevron-bottom';
import { useNavigate } from 'react-router';
import { paths } from '@/app/router/paths';
import { useCurrentUser, useSignOut } from '../api/queries';
import { hasPrivilege } from '../utils/permissions';

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
        aria-label={`Hesap menüsü: ${user.displayName}, ${user.roleNames.join(', ')}`}
      >
        <span className="c-user-menu__name">{user.displayName}</span>
        {user.roleNames[0] && (
          <Badge variant="neutral" appearance="filledLight" size="small">
            {user.roleNames[0]}
            {user.roleNames.length > 1 && ` +${user.roleNames.length - 1}`}
          </Badge>
        )}
      </Dropdown.Trigger>
      <Dropdown.Content align="end">
        <Dropdown.Label>{user.email}</Dropdown.Label>
        <Dropdown.Separator />
        <Dropdown.Label>{user.roleNames.join(', ')}</Dropdown.Label>
        <Dropdown.Separator />
        {hasPrivilege(user, 'users:view') && (
          <Dropdown.Item onSelect={() => void navigate(paths.admin.users())}>
            Kullanıcılar
          </Dropdown.Item>
        )}
        {hasPrivilege(user, 'roles:view') && (
          <Dropdown.Item onSelect={() => void navigate(paths.admin.roles())}>
            Roller ve yetkiler
          </Dropdown.Item>
        )}
        <Dropdown.Item
          onSelect={() =>
            signOut.mutate(undefined, {
              onSuccess: () => void navigate(paths.signIn(), { replace: true }),
            })
          }
        >
          Çıkış yap
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown>
  );
}
