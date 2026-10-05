import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { APP, PRJ } from '@/services/mock/data/ids';
import { renderRoute } from '@/test/renderWithProviders';

describe('portfolio map', () => {
  it('draws applications and projects and shows what a clicked node touches', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/architecture');
    const map = await screen.findByRole('group', { name: 'Uygulama ve proje bağlantı haritası' });
    const gateway = await within(map).findByRole('button', { name: /^Uygulama Ödeme Geçidi,/ });
    expect(
      within(map).getByRole('button', { name: /^Proje Ödeme Platformu Modernizasyonu/ }),
    ).toBeInTheDocument();

    await user.click(gateway);
    const details = await screen.findByRole('complementary', { name: 'Seçilen kayıt' });
    expect(within(details).getByRole('heading', { name: 'Ödeme Geçidi' })).toBeInTheDocument();
    expect(
      within(details).getByRole('heading', { name: /Ona bağımlı uygulamalar/ }),
    ).toBeInTheDocument();
    expect(
      within(details).getByRole('heading', { name: /Onu değiştiren projeler/ }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toContain(`focus=a-${APP.paymentGateway}`);

    // Following a link moves the selection to the other record.
    await user.click(
      within(details).getByRole('button', { name: /Ödeme Platformu Modernizasyonu/ }),
    );
    await waitFor(() =>
      expect(router.state.location.search).toContain(`focus=p-${PRJ.paymentModernisation}`),
    );
    expect(
      within(screen.getByRole('complementary', { name: 'Seçilen kayıt' })).getByRole('heading', {
        name: /Etkilediği uygulamalar/,
      }),
    ).toBeInTheDocument();
  });

  it('hides project links when projects are switched off', async () => {
    const user = userEvent.setup();
    renderRoute(`/architecture?focus=a-${APP.paymentGateway}`);
    const map = await screen.findByRole('group', { name: 'Uygulama ve proje bağlantı haritası' });
    await within(map).findByRole('button', { name: /^Uygulama Ödeme Geçidi,/ });
    await user.click(screen.getByRole('switch', { name: 'Projeler' }));
    await waitFor(() =>
      expect(within(map).queryByRole('button', { name: /^Proje / })).not.toBeInTheDocument(),
    );
  });

  it('keeps old impact analysis links working', async () => {
    renderRoute(`/architecture?app=${APP.paymentGateway}`);
    expect(await screen.findByText(/Ödeme Geçidi erişilemezse etkilenenler/)).toBeInTheDocument();
  });
});
