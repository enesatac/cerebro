import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { APP, USER } from '@/services/mock/data/ids';
import { renderRoute } from '@/test/renderWithProviders';

describe('release calendar', () => {
  it('shows applications down the side with their releases on their days', async () => {
    renderRoute('/releases?date=2026-10-01');
    const calendar = await screen.findByRole('region', { name: 'Canlı geçiş takvimi' });
    expect(
      await within(calendar).findByRole('rowheader', { name: /Müşteri Portalı/ }),
    ).toBeInTheDocument();
    expect(
      within(calendar).getByRole('button', { name: /CHG-2026-0350 Müşteri portalı e-KYC adımı/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Geçiş ekle' })).toBeInTheDocument();
  });

  it('switches the rows to projects and opens a release card', async () => {
    const user = userEvent.setup();
    renderRoute('/releases?date=2026-10-01');
    await screen.findByRole('region', { name: 'Canlı geçiş takvimi' });
    await user.click(screen.getByRole('button', { name: 'Projeler' }));
    const calendar = await screen.findByRole('region', { name: 'Canlı geçiş takvimi' });
    expect(
      await within(calendar).findByRole('rowheader', { name: /Dijital Müşteri Kazanım/ }),
    ).toBeInTheDocument();
    expect(within(calendar).getByRole('rowheader', { name: /Projesiz geçişler/ })).toBeVisible();
    await user.click(within(calendar).getByRole('button', { name: /CHG-2026-0341/ }));
    expect(await screen.findByText('Sadakat motoru puan kuralları')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ayrıntılar' })).toHaveAttribute('href', '/releases/6');
  });

  it('lists and filters releases by status', async () => {
    const user = userEvent.setup();
    renderRoute('/releases?date=2026-09-01&range=3m&tab=list');
    const table = await screen.findByRole('table');
    expect(await within(table).findByText('CHG-2026-0311 · v5.4.0')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Durum' }));
    await user.click(await screen.findByRole('option', { name: 'Geri alındı' }));
    await waitFor(() =>
      expect(screen.queryByText('CHG-2026-0311 · v5.4.0')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Bildirim servisi kuyruk göçü' })).toBeInTheDocument();
  });

  it('is read-only for business units', async () => {
    renderRoute('/releases?date=2026-10-01', createMockRepositories({ signedInAs: USER.elifKaya }));
    await screen.findByRole('region', { name: 'Canlı geçiş takvimi' });
    expect(screen.queryByRole('link', { name: 'Geçiş ekle' })).not.toBeInTheDocument();
  });

  it('records a release from an application’s tab, pre-filled with the application', async () => {
    const user = userEvent.setup();
    const { router, repositories } = renderRoute(
      `/applications/${APP.paymentGateway}?tab=releases`,
    );
    const table = await screen.findByRole('table', {}, { timeout: 5000 });
    await within(table).findByRole('link', { name: 'Ödeme yönlendirme yeni sağlayıcı' });
    await user.click(screen.getByRole('link', { name: 'Geçiş ekle' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/releases/new'));
    expect(
      await screen.findByRole('combobox', { name: /Uygulama/ }, { timeout: 5000 }),
    ).toHaveTextContent('Ödeme Geçidi');
    const number = screen.getByRole('textbox', { name: /Geçiş no/ });
    await user.type(number, 'CHG-2026-0311');
    await user.type(screen.getByRole('textbox', { name: /^Başlık/ }), 'Kur güncellemesi');
    await user.click(screen.getByRole('combobox', { name: /^Tür/ }));
    await user.click(await screen.findByRole('option', { name: 'Düzeltme' }));
    await user.type(screen.getByRole('textbox', { name: /Geçiş tarihi/ }), '15/12/2026');
    await user.click(screen.getByRole('button', { name: 'Geçişi kaydet' }));
    // The number is taken: the server's answer lands on the field.
    expect(
      await screen.findAllByText(
        'CHG-2026-0311 numaralı bir geçiş zaten var.',
        {},
        { timeout: 5000 },
      ),
    ).not.toHaveLength(0);
    await user.clear(number);
    await user.type(number, 'CHG-2026-0999');
    await user.click(screen.getByRole('button', { name: 'Geçişi kaydet' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/releases\/\d+$/), {
      timeout: 10_000,
    });
    const saved = await repositories.releases.list({ applicationId: APP.paymentGateway });
    expect(saved.find((r) => r.releaseNumber === 'CHG-2026-0999')).toMatchObject({
      plannedDate: '2026-12-15',
      status: 'planned',
      type: 'patch',
    });
  });
});
