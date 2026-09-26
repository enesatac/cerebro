import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { LoadingState } from '@/components/feedback/LoadingState';
import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { UserMenu } from '@/domains/auth/components/UserMenu';
import { MasterDataProvider } from '@/domains/master-data/components/MasterDataProvider';
import { paths } from '../router/paths';
import { GlobalSearch } from './GlobalSearch';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="c-shell">
      <a className="c-skip-link" href="#main-content">
        Ana içeriğe geç
      </a>
      <header className="c-topbar">
        <Link to={paths.dashboard()} className="c-topbar__brand">
          <span className="c-topbar__logo" aria-hidden="true" />
          Cerebro
        </Link>
        <GlobalSearch />
        <div className="c-topbar__end">
          <UserMenu />
        </div>
      </header>
      <Sidebar />
      <main id="main-content" className="c-main" tabIndex={-1}>
        <RequireAuth>
          <MasterDataProvider>
            <Suspense fallback={<LoadingState label="Sayfa yükleniyor" />}>
              <Outlet />
            </Suspense>
          </MasterDataProvider>
        </RequireAuth>
      </main>
    </div>
  );
}
