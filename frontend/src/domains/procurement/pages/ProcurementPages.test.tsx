import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { CON, USER } from '@/services/mock/data/ids';
import { renderRoute } from '@/test/renderWithProviders';

describe('procurement tracker', () => {
  it('opens read-only on the business unit’s own purchases', async () => {
    renderRoute('/procurement', createMockRepositories({ signedInAs: USER.elifKaya }));
    expect(await screen.findByText(/salt okunur görüntülüyorsunuz/)).toBeInTheDocument();
    const table = await screen.findByRole('table');
    expect(
      await within(table).findByRole('link', { name: 'Rezervasyon verisi taşıma hizmeti' }),
    ).toBeInTheDocument();
    // Another unit's purchase is filtered out until the filter is widened.
    expect(
      within(table).queryByRole('link', { name: /Felaket kurtarma merkezi/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Düzenle' })).not.toBeInTheDocument();
  });

  it('lets business units widen the filter and read shared notes only', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute(
      '/procurement',
      createMockRepositories({ signedInAs: USER.elifKaya }),
    );
    await screen.findByRole('table');
    await user.click(screen.getByRole('combobox', { name: 'İş birimi' }));
    await user.click(await screen.findByRole('option', { name: 'Tüm iş birimleri' }));
    expect(
      await screen.findByRole('link', { name: /Felaket kurtarma merkezi/ }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toContain('unit=all');

    await router.navigate(`/procurement/${CON.bookingMigration}`);
    expect(
      await screen.findByText('Üç tedarikçiden teklif alındı; ikisi teknik değerlendirmeyi geçti.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Hedef fiyat bütçenin/)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Yeni not' })).not.toBeInTheDocument();
  });

  it('shows late steps on the deadlines tab', async () => {
    renderRoute(
      '/procurement?tab=deadlines',
      createMockRepositories({ signedInAs: USER.zeynepCelik }),
    );
    const table = await screen.findByRole('table');
    expect(await within(table).findAllByText(/gün gecikti/)).not.toHaveLength(0);
  });

  it('adds an internal note as the procurement team', async () => {
    const user = userEvent.setup();
    const { repositories } = renderRoute(
      `/procurement/${CON.uxResearch}`,
      createMockRepositories({ signedInAs: USER.zeynepCelik }),
    );
    await screen.findByText('Henüz not yok.');
    await screen.findByRole('cell', { name: /Süreç adımları henüz tanımlanmadı/ });
    const text = await screen.findByRole('textbox', { name: 'Yeni not' });
    await user.type(text, 'Teklifler 20 Ekim’de açılacak.');
    await waitFor(() => expect(text).toHaveValue('Teklifler 20 Ekim’de açılacak.'));
    await user.click(screen.getByRole('switch', { name: 'İç not' }));
    await user.click(screen.getByRole('button', { name: 'Notu ekle' }));
    await screen.findByText('Not eklendi');
    const notes = (await repositories.procurement.getById(CON.uxResearch)).notes;
    expect(notes[0]).toMatchObject({ text: 'Teklifler 20 Ekim’de açılacak.', internal: true });
  });

  it('defines a process from the standard steps', async () => {
    const user = userEvent.setup();
    const { router, repositories } = renderRoute(
      `/procurement/${CON.uxResearch}/steps`,
      createMockRepositories({ signedInAs: USER.zeynepCelik }),
    );
    await user.click(await screen.findByRole('button', { name: 'Standart adımları ekle' }));
    expect(await screen.findByRole('combobox', { name: /11\. adım/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Adımları kaydet' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/procurement/${CON.uxResearch}`),
    );
    const process = await repositories.procurement.getById(CON.uxResearch);
    expect(process.steps.map((s) => s.type)[0]).toBe('need-definition');
    expect(process.steps).toHaveLength(11);
  });
});
