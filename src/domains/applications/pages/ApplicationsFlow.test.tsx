import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';

describe('Applications list → detail', () => {
  it('lists applications and opens the detail page from a row link', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/applications');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Applications' }),
    ).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: 'Payment Gateway' });
    await user.click(link);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Payment Gateway' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/applications/app-payment-gateway');
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(breadcrumb).getByRole('link', { name: 'Applications' })).toBeInTheDocument();
  });

  it('applies filters from the URL so filtered views are shareable', async () => {
    renderRoute('/applications?technology=tech-oracle');
    expect(await screen.findByText('4 applications')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crew Scheduling Engine' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Customer Portal' })).not.toBeInTheDocument();
  });

  it('shows a specific empty state with a way out when nothing matches', async () => {
    const user = userEvent.setup();
    renderRoute('/applications?q=zzz-no-match');
    expect(await screen.findByText('No applications match these filters')).toBeInTheDocument();
    // The empty state's action (the toolbar button is labelled with the filter count).
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Payment Gateway' })).toBeInTheDocument(),
    );
  });

  it('shows ownership, lifecycle and criticality on the detail page', async () => {
    renderRoute('/applications/app-customer-identity');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Customer Identity Platform' }),
    ).toBeInTheDocument();
    const facts = screen.getByRole('region', { name: 'Key facts' });
    await waitFor(() => expect(within(facts).getByText('Jonas Berg')).toBeInTheDocument());
    expect(screen.getByText('Critical criticality')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('deep-links to a tab and resolves related applications', async () => {
    renderRoute('/applications/app-customer-identity?tab=dependencies');
    expect(
      await screen.findByRole('tab', { name: 'Dependencies', selected: true }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Customer Portal' })).toHaveAttribute(
      'href',
      '/applications/app-customer-portal',
    );
  });

  it('shows a not-found state for unknown applications', async () => {
    renderRoute('/applications/app-missing');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Application not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to applications' })).toHaveAttribute(
      'href',
      '/applications',
    );
  });

  it('gives every primary navigation link an accessible name', async () => {
    renderRoute('/applications');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    for (const name of ['Dashboard', 'Projects', 'Applications', 'Connections', 'Teams']) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('link', { name: 'Applications' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
