import { DataObjectIconOutlinedRounded } from '@takeoff-icons/react/data-object';
import { UserSettingsIconOutlinedRounded } from '@takeoff-icons/react/user-settings';
import { NavLink } from 'react-router';
import { usePermission } from '@/domains/auth/api/queries';
import { paths } from '../router/paths';
import {
  DEMAND_MANAGEMENT_NAVIGATION,
  PRIMARY_NAVIGATION,
  type NavigationItem,
} from './navigation';

const MASTER_DATA_NAVIGATION: NavigationItem = {
  label: 'Ana veriler',
  to: paths.admin.masterData(),
  icon: DataObjectIconOutlinedRounded,
};
const USERS_NAVIGATION: NavigationItem = {
  label: 'Kullanıcılar ve roller',
  to: paths.admin.users(),
  icon: UserSettingsIconOutlinedRounded,
};

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

/** Primary and (for admins) administration links; shared by the sidebar and the mobile drawer. */
export function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const canManageUsers = usePermission('users:manage');
  const canManageMasterData = usePermission('masterData:manage');
  const canManageDemands = usePermission('demands:manage');
  const primaryItems = canManageDemands
    ? PRIMARY_NAVIGATION.flatMap((item) =>
        item.to === paths.demands.list() ? [item, DEMAND_MANAGEMENT_NAVIGATION] : [item],
      )
    : PRIMARY_NAVIGATION;
  const adminItems = [
    ...(canManageMasterData ? [MASTER_DATA_NAVIGATION] : []),
    ...(canManageUsers ? [USERS_NAVIGATION] : []),
  ];
  return (
    <>
      <NavList items={primaryItems} onNavigate={onNavigate} />
      {adminItems.length > 0 && (
        <div className="c-sidebar__section">
          <p className="c-sidebar__heading">Yönetim</p>
          <NavList items={adminItems} onNavigate={onNavigate} />
        </div>
      )}
    </>
  );
}
