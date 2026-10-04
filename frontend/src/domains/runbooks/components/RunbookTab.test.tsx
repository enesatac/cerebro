import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { APP } from '@/services/mock/data/ids';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

describe('"Sorun anında" tab', () => {
  it('shows first response, contacts, addresses and searchable known problems', async () => {
    const user = userEvent.setup();
    renderRoute(`/applications/${APP.paymentGateway}?tab=runbook`);
    expect(await screen.findByRole('heading', { name: 'Sorun anında' })).toBeInTheDocument();
    expect(screen.getByText('0/5 adım tamamlandı')).toBeInTheDocument();
    await user.click(screen.getAllByRole('checkbox')[0] as HTMLElement);
    expect(screen.getByText('1/5 adım tamamlandı')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Ödeme Geçidi panosu/ })).toHaveAttribute(
      'href',
      'https://grafana.corp.example/d/payments-gateway',
    );
    expect(screen.getByText('Nöbet hattı: dahili 4410 · #app-support')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Sorun ara' }), 'timeout');
    // The search commits after a short pause.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /3D Secure/ })).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Kart sağlayıcısı zaman aşımı veriyor/ }),
    ).toBeInTheDocument();
  });

  it('invites admins to write one when the application has none', async () => {
    renderRoute(`/applications/${APP.customerPortal}?tab=runbook`);
    expect(await screen.findByText(/için müdahale rehberi yok/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rehber oluştur' })).toHaveAttribute(
      'href',
      `/applications/${APP.customerPortal}/runbook/edit`,
    );
  });

  it('is readable but not editable for regular users', async () => {
    renderRoute(
      `/applications/${APP.paymentGateway}?tab=runbook`,
      createMockRepositories({ signedInAs: TEST_VIEWER }),
    );
    const hero = await screen.findByRole('region', { name: 'Müdahale rehberi özeti' });
    expect(within(hero).queryByRole('link', { name: 'Rehberi düzenle' })).not.toBeInTheDocument();
  });

  it('creates a runbook from the form', async () => {
    const user = userEvent.setup();
    renderRoute(`/applications/${APP.customerPortal}/runbook/edit`);
    const steps = await screen.findByRole('textbox', { name: 'Adımlar' });
    // Person and team options load after the form; let them settle before typing.
    await screen.findAllByRole('button', { name: /Kişi ekle/ });
    await user.click(steps);
    await user.keyboard('Durum sayfasına bakın{Enter}Logları kontrol edin');
    expect(steps).toHaveValue('Durum sayfasına bakın\nLogları kontrol edin');
    await user.click(screen.getByRole('button', { name: 'Rehberi kaydet' }));
    expect(await screen.findByText('0/2 adım tamamlandı')).toBeInTheDocument();
  });
});
