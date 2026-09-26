import { Button, Drawer } from '@takeoff-ui/react-spar';
import { MenuHamburgerIconOutlinedRounded } from '@takeoff-icons/react/menu-hamburger';
import { useState } from 'react';
import { NavigationLinks } from './NavigationLinks';

/** Narrow screens: a menu button in the top bar opens the navigation in a Takeoff `Drawer`. */
export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <div className="c-topbar__menu">
      <Button
        variant="neutral"
        appearance="text"
        size="small"
        startContent={<MenuHamburgerIconOutlinedRounded aria-hidden="true" />}
        aria-label="Menüyü aç"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      <Drawer open={open} onOpenChange={setOpen} placement="left" forceMount={false}>
        <Drawer.Overlay />
        <Drawer.Panel className="c-mobile-nav">
          <Drawer.Header headerType="divided">
            <Drawer.Title level={2}>Cerebro</Drawer.Title>
            <Drawer.Close aria-label="Menüyü kapat" />
          </Drawer.Header>
          <Drawer.Body>
            <nav aria-label="Ana menü">
              <NavigationLinks onNavigate={() => setOpen(false)} />
            </nav>
          </Drawer.Body>
        </Drawer.Panel>
      </Drawer>
    </div>
  );
}
