import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { LoadingState } from '@/components/feedback/LoadingState';
import { RequireAuth } from '@/domains/auth/components/RequireAuth';
import { UserMenu } from '@/domains/auth/components/UserMenu';
import { paths } from '../router/paths';
import { GlobalSearch } from './GlobalSearch';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="c-shell">
      <a className="c-skip-link" href="#main-content">
        Skip to main content
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
          <Suspense fallback={<LoadingState label="Loading page" />}>
            <Outlet />
          </Suspense>
        </RequireAuth>
      </main>
    </div>
  );
}
