import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { DEM, PERSON } from '@/services/mock/data/ids';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

describe('demands page', () => {
  it('shows a requester their own demands first, and everyone else’s on the second tab', async () => {
    const user = userEvent.setup();
    renderRoute('/demands', createMockRepositories({ signedInAs: TEST_VIEWER }));
    const table = await screen.findByRole('table');
    expect(await within(table).findByRole('link', { name: 'Yolcu bildirim tercih merkezi' }));
    expect(within(table).getAllByRole('row')).toHaveLength(4); // header + Elif's 3 demands
    expect(within(table).queryByText(/Kargo gönderi takibi/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Tüm talepler/ }));
    expect(
      await screen.findByRole('link', { name: /Kargo gönderi takibinin/ }),
    ).toBeInTheDocument();
    // Business units submit; only the portfolio office manages.
    expect(screen.getByRole('link', { name: 'Yeni talep' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Talep yönetimi' })).not.toBeInTheDocument();
  });

  it('lets a business user submit a demand pre-filled with their unit', async () => {
    const user = userEvent.setup();
    const { router, repositories } = renderRoute(
      '/demands/new',
      createMockRepositories({ signedInAs: TEST_VIEWER }),
    );
    const requester = await screen.findByRole(
      'combobox',
      { name: /Talep eden/ },
      { timeout: 5000 },
    );
    await waitFor(() => expect(requester).toHaveTextContent('Elif Kaya'));
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /İş birimi/ })).toHaveTextContent(
        'Dijital Kanallar',
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Talebi gönder' }));
    expect(await screen.findByText(/Kaydetmeden önce \d sorunu düzeltin/)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /^Başlık/ }), 'Koltuk seçimi paketi');
    await user.click(screen.getByRole('combobox', { name: /Talep türü/ }));
    await user.click(await screen.findByRole('option', { name: 'Geliştirme / iyileştirme' }));
    await user.type(
      screen.getByRole('textbox', { name: /Mevcut durum ve ihtiyaç/ }),
      'Mobilde koltuk seçimi yok.',
    );
    await user.type(screen.getByRole('textbox', { name: /^Beklenen fayda/ }), 'Yan gelir.');
    await user.click(screen.getByRole('button', { name: 'Talebi gönder' }));

    const id = DEM.cargoTracking + 1;
    await waitFor(() => expect(router.state.location.pathname).toBe(`/demands/${id}`));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Koltuk seçimi paketi' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Henüz değerlendirilmedi')).toBeInTheDocument();
    const saved = await repositories.demands.getById(id);
    expect(saved).toMatchObject({ requesterId: PERSON.elifKaya, status: 'submitted' });
  });

  it('shows the question to answer and lets the requester withdraw', async () => {
    const user = userEvent.setup();
    const repositories = createMockRepositories({ signedInAs: TEST_VIEWER });
    renderRoute(`/demands/${DEM.notificationPreferences}`, repositories);
    await user.click(await screen.findByRole('button', { name: 'Geri çek' }));
    const dialog = await screen.findByRole('dialog', { name: /TLP-0013 geri çekilsin mi/ });
    await user.type(within(dialog).getByRole('textbox'), 'Gerek kalmadı.');
    await user.click(within(dialog).getByRole('button', { name: 'Talebi geri çek' }));
    expect(await screen.findByText('TLP-0013 geri çekildi')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /Düzenle/ })).not.toBeInTheDocument(),
    );
    expect((await repositories.demands.getById(DEM.notificationPreferences)).status).toBe(
      'withdrawn',
    );
  });

  it('refuses to open someone else’s demand for editing', async () => {
    renderRoute(
      `/demands/${DEM.cargoTracking}/edit`,
      createMockRepositories({ signedInAs: TEST_VIEWER }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Erişim yetkiniz yok' }),
    ).toBeInTheDocument();
  });
});
