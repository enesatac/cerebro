import { NavLink } from 'react-router';
import { useCurrentUser } from '@/domains/auth/api/queries';
import { hasPrivilege } from '@/domains/auth/utils/permissions';
import { ADMIN_NAVIGATION, PRIMARY_NAVIGATION, type NavigationItem } from './navigation';

function NavList({ items, onNavigate }: { items: NavigationItem[]; onNavigate?: () => void }) {
  return (
    <ul className="c-sidebar__list">
      {items.map(({ label, to, icon: Icon, end }) => (
        <li key={to}>
          <NavLink to={to} end={end} className="c-sidebar__link" onClick={onNavigate}>
            <Icon className="c-sidebar__icon" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/** The screens the signed-in user's roles can view; shared by the sidebar and the mobile drawer. */
export function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  const allowed = (items: NavigationItem[]) =>
    items.filter((item) => hasPrivilege(user, item.privilege));
  const adminItems = allowed(ADMIN_NAVIGATION);
  return (
    <>
      <NavList items={allowed(PRIMARY_NAVIGATION)} onNavigate={onNavigate} />
      {adminItems.length > 0 && (
        <div className="c-sidebar__section">
          <p className="c-sidebar__heading">Yönetim</p>
          <NavList items={adminItems} onNavigate={onNavigate} />
        </div>
      )}
    </>
  );
}
