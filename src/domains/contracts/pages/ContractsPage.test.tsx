import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { CON, PRJ, USER } from '@/services/mock/data/ids';
import { renderRoute } from '@/test/renderWithProviders';

describe('contracts', () => {
  it('lists contracts with what needs attention and filters by vendor', async () => {
    const user = userEvent.setup();
    renderRoute('/contracts');
    const table = await screen.findByRole('table');
    expect(
      await within(table).findByRole('link', { name: 'SMS gönderim hizmeti' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Tedarikçi' }));
    await user.click(await screen.findByRole('option', { name: 'Fabrikam Donanım Ltd.' }));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'SMS gönderim hizmeti' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: /Ödeme HSM cihazları/ })).toBeInTheDocument();
  });

  it('adds a vendor from the suppliers tab', async () => {
    const user = userEvent.setup();
    const { repositories } = renderRoute('/contracts?tab=vendors');
    await screen.findByText('Northwind Yazılım A.Ş.', {}, { timeout: 5000 });
    await user.click(screen.getByRole('button', { name: 'Tedarikçi ekle' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tedarikçi ekle' });
    await user.type(within(dialog).getByRole('textbox', { name: /Firma adı/ }), 'Wingtip Lojistik');
    await user.click(within(dialog).getByRole('button', { name: 'Tedarikçi ekle' }));
    await screen.findByText('Wingtip Lojistik eklendi');
    expect((await repositories.vendors.list()).map((v) => v.name)).toContain('Wingtip Lojistik');
  });

  it('shows the payment plan, alerts and required signed contract on the detail page', async () => {
    renderRoute(`/contracts/${CON.identityVerification}`);
    expect(await screen.findByRole('heading', { level: 1, name: /e-KYC/ })).toBeInTheDocument();
    const alerts = screen.getByRole('region', { name: 'Sözleşme uyarıları' });
    expect(within(alerts).getByText(/ödemenin vadesi geçti/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Ödeme özeti' })).toHaveTextContent('Ödenen');
    const checklist = await screen.findByRole('region', { name: 'Gerekli belgeler' });
    expect(within(checklist).getByText('1/1 yüklendi', { exact: false })).toBeInTheDocument();
  });

  it('shows a project’s purchases on its tab and hides the tab without the privilege', async () => {
    renderRoute(`/projects/${PRJ.opsResilience}?tab=contracts`);
    expect(
      await screen.findByRole('link', { name: /Felaket kurtarma merkezi/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sözleşme ekle' })).toHaveAttribute(
      'href',
      `/contracts/new?project=${PRJ.opsResilience}`,
    );
  });

  it('hides the purchases tab from roles without contracts', async () => {
    renderRoute(
      `/projects/${PRJ.opsResilience}`,
      createMockRepositories({ signedInAs: USER.elifKaya }),
    );
    await screen.findByRole('tab', { name: /Genel bakış/ });
    expect(screen.queryByRole('tab', { name: /Satın alma/ })).not.toBeInTheDocument();
  });

  it('records a new contract with an instalment for a project', async () => {
    const user = userEvent.setup();
    const { router, repositories } = renderRoute(`/contracts/new?project=${PRJ.opsResilience}`);
    await screen.findByRole('combobox', { name: /Tedarikçi/ }, { timeout: 5000 });
    const title = await screen.findByRole('textbox', { name: /^Başlık/ });
    await user.type(title, 'Yük testi aracı');
    await waitFor(() => expect(title).toHaveValue('Yük testi aracı'));
    await user.click(screen.getByRole('combobox', { name: /Tedarikçi/ }));
    await user.click(await screen.findByRole('option', { name: 'Northwind Yazılım A.Ş.' }));
    await user.click(screen.getByRole('combobox', { name: /^Tür/ }));
    await user.click(await screen.findByRole('option', { name: 'Lisans' }));
    await user.click(screen.getByRole('button', { name: 'Sözleşmeyi kaydet' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/contracts\/\d+$/), {
      timeout: 10_000,
    });
    const saved = await repositories.contracts.list({ projectId: PRJ.opsResilience });
    expect(saved.find((c) => c.title === 'Yük testi aracı')?.status).toBe('draft');
  });
});
