import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';

describe('Applications list → detail', () => {
  it('lists applications and opens the detail page from a row link', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/applications');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Uygulamalar' }),
    ).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: 'Ödeme Geçidi' });
    await user.click(link);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ödeme Geçidi' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/applications/app-payment-gateway');
    const breadcrumb = screen.getByRole('navigation', { name: 'Sayfa yolu' });
    expect(within(breadcrumb).getByRole('link', { name: 'Uygulamalar' })).toBeInTheDocument();
  });

  it('applies filters from the URL so filtered views are shareable', async () => {
    renderRoute('/applications?technology=tech-oracle');
    expect(await screen.findByText('4 uygulama')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ekip Planlama Motoru' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Müşteri Portalı' })).not.toBeInTheDocument();
  });

  it('shows a specific empty state with a way out when nothing matches', async () => {
    const user = userEvent.setup();
    renderRoute('/applications?q=zzz-no-match');
    expect(await screen.findByText('Bu filtrelere uyan uygulama yok')).toBeInTheDocument();
    // The empty state's action (the toolbar button is labelled with the filter count).
    await user.click(screen.getByRole('button', { name: 'Filtreleri temizle' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Ödeme Geçidi' })).toBeInTheDocument(),
    );
  });

  it('shows ownership, lifecycle and criticality on the detail page', async () => {
    renderRoute('/applications/app-customer-identity');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Müşteri Kimlik Platformu' }),
    ).toBeInTheDocument();
    const facts = screen.getByRole('region', { name: 'Temel bilgiler' });
    await waitFor(() => expect(within(facts).getByText('Jonas Berg')).toBeInTheDocument());
    expect(screen.getByText('Kritiklik: Kritik')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('deep-links to a tab and resolves related applications', async () => {
    renderRoute('/applications/app-customer-identity?tab=dependencies');
    expect(
      await screen.findByRole('tab', { name: 'Bağımlılıklar', selected: true }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Müşteri Portalı' })).toHaveAttribute(
      'href',
      '/applications/app-customer-portal',
    );
  });

  it('shows a not-found state for unknown applications', async () => {
    renderRoute('/applications/app-missing');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Uygulama bulunamadı' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Uygulamalara dön' })).toHaveAttribute(
      'href',
      '/applications',
    );
  });

  it('gives every primary navigation link an accessible name', async () => {
    renderRoute('/applications');
    const nav = await screen.findByRole('navigation', { name: 'Ana menü' });
    for (const name of ['Gösterge paneli', 'Projeler', 'Uygulamalar', 'Bağlantılar', 'Ekipler']) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('link', { name: 'Uygulamalar' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
