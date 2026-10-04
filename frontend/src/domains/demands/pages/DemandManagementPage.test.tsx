import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { DEM } from '@/services/mock/data/ids';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

/**
 * The table re-renders its cells once people and business units load; wait for both so the
 * button clicked is the one on screen.
 */
async function assessButton(code: string) {
  await screen.findAllByText('Omar Haddad', {}, { timeout: 5000 });
  await screen.findAllByText('Teknoloji Platformları');
  return screen.getByRole('button', { name: new RegExp(`Değerlendir: ${code}`) });
}

describe('demand management page', () => {
  it('lists what waits for a decision, oldest first', async () => {
    renderRoute('/demands/manage');
    const table = await screen.findByRole('table');
    const links = await within(table).findAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'İzin taleplerinin mobil uygulamadan yapılabilmesi',
      'Müşteri hizmetlerinde yapay zekâ destekli ön karşılama',
      'Uçuş ekibi yorgunluk riski raporlama paneli',
      'Yolcu bildirim tercih merkezi',
      'Kargo gönderi takibinin müşteri portalına eklenmesi',
      'VPN yerine sıfır güven tabanlı uzaktan erişim',
    ]);
    expect(screen.getByRole('group', { name: 'Talep özeti' })).toHaveTextContent('Yeni talepler3');
  });

  it('asks for a reason before rejecting, then records the decision', async () => {
    const user = userEvent.setup();
    const { repositories } = renderRoute('/demands/manage');
    await user.click(await assessButton('TLP-0014'));
    const dialog = await screen.findByRole('dialog', { name: 'Değerlendir: TLP-0014' });
    await user.click(within(dialog).getByRole('combobox', { name: /Durum/ }));
    await user.click(await screen.findByRole('option', { name: 'Reddedildi' }));
    await user.click(within(dialog).getByRole('button', { name: 'Değerlendirmeyi kaydet' }));
    expect(
      await within(dialog).findByText(
        'Reddetmek için gerekçeyi yazın; talep sahibi bu notu görür.',
      ),
    ).toBeInTheDocument();

    await user.type(
      within(dialog).getByRole('textbox', { name: /Karar notu/ }),
      'Güvenlik programında ele alınıyor.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Değerlendirmeyi kaydet' }));
    expect(await screen.findByText('TLP-0014 değerlendirmesi kaydedildi')).toBeInTheDocument();
    const saved = await repositories.demands.getById(DEM.zeroTrustAccess);
    expect(saved.status).toBe('rejected');
    expect(saved.history.at(-1)?.note).toBe('Güvenlik programında ele alınıyor.');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /VPN yerine/ })).not.toBeInTheDocument(),
    );
  });

  it('scores a demand and shows the suggested priority', async () => {
    const user = userEvent.setup();
    renderRoute('/demands/manage?tab=backlog');
    await user.click(await assessButton('TLP-0015'));
    const dialog = await screen.findByRole('dialog', { name: 'Değerlendir: TLP-0015' });
    for (const [criterion, score] of [
      ['İş değeri', '4'],
      ['Stratejik uyum', '3'],
      ['Zaman kritikliği', '2'],
      ['Risk azaltma', '1'],
      ['Efor', '2'],
    ] as const) {
      const group = within(dialog).getByRole('radiogroup', { name: criterion });
      await user.click(within(group).getByRole('radio', { name: score }));
    }
    // (4 + 3 + 2 + 1) ÷ 2
    expect(dialog.querySelector('.c-score-summary__number')).toHaveTextContent(/^5$/);
    await user.click(within(dialog).getByRole('button', { name: 'Önerilen önceliği uygula' }));
    expect(within(dialog).getByRole('combobox', { name: /Öncelik/ })).toHaveTextContent(
      'P2 — Yüksek',
    );
  });

  it('is closed to regular users', async () => {
    renderRoute('/demands/manage', createMockRepositories({ signedInAs: TEST_VIEWER }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Erişim yetkiniz yok' }),
    ).toBeInTheDocument();
  });
});
