import { NavigationLinks } from './NavigationLinks';

/**
 * Primary navigation on wide screens. Takeoff UI has no navigation/sidebar component, so this is a
 * thin semantic `<nav>` styled with Takeoff tokens. `NavLink` sets `aria-current="page"`.
 * Narrow screens use `MobileNavigation` instead (the sidebar is hidden by CSS).
 */
export function Sidebar() {
  return (
    <nav className="c-sidebar" aria-label="Ana menü">
      <NavigationLinks />
    </nav>
  );
}
