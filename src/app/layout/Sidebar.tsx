import { UserSettingsIconOutlinedRounded } from '@takeoff-icons/react/user-settings';
import { NavLink } from 'react-router';
import { usePermission } from '@/domains/auth/api/queries';
import { paths } from '../router/paths';
import { PRIMARY_NAVIGATION, type NavigationItem } from './navigation';

const ADMIN_NAVIGATION: NavigationItem[] = [
  { label: 'Users & roles', to: paths.admin.users(), icon: UserSettingsIconOutlinedRounded },
];

function NavList({ items }: { items: NavigationItem[] }) {
  return (
    <ul className="c-sidebar__list">
      {items.map(({ label, to, icon: Icon, end }) => (
        <li key={to}>
          <NavLink to={to} end={end} className="c-sidebar__link">
            <Icon className="c-sidebar__icon" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Primary navigation. Takeoff UI has no navigation/sidebar component, so this is a thin
 * semantic `<nav>` styled with Takeoff tokens. `NavLink` sets `aria-current="page"`.
 */
export function Sidebar() {
  const canManageUsers = usePermission('users:manage');
  return (
    <nav className="c-sidebar" aria-label="Main">
      <NavList items={PRIMARY_NAVIGATION} />
      {canManageUsers && (
        <div className="c-sidebar__section">
          <p className="c-sidebar__heading" id="nav-admin-heading">
            Administration
          </p>
          <NavList items={ADMIN_NAVIGATION} />
        </div>
      )}
    </nav>
  );
}
