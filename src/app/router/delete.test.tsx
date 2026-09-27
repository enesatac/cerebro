import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';
import { APP } from '@/services/mock/data/ids';

describe('deleting records', () => {
  it('deletes a risk from its register row after confirmation', async () => {
    const user = userEvent.setup();
    const { repositories } = renderRoute('/risks?tab=risks');
    const before = (await repositories.risks.list()).length;

    // Owner names resolve in a second pass; wait for it so the row is not re-rendered under the click.
    await screen.findAllByText('Jonas Berg');
    const target = (await screen.findAllByRole('button', { name: /^Sil: / }))[0];
    if (!target) throw new Error('no delete action rendered');
    const name = target.getAttribute('aria-label')?.replace('Sil: ', '') ?? '';
    await user.click(target);

    const dialog = await screen.findByRole('alertdialog', { name: `${name} silinsin mi?` });
    const confirm = within(dialog).getByRole('button', { name: 'Kalıcı olarak sil' });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    await screen.findByText('Risk silindi');
    expect(await repositories.risks.list()).toHaveLength(before - 1);
  });

  it('offers delete on detail pages and list rows only to admins', async () => {
    renderRoute(`/applications/${APP.paymentGateway}`);
    expect(await screen.findByRole('button', { name: 'Uygulama sil' })).toBeInTheDocument();
  });

  it('hides delete from read-only users', async () => {
    renderRoute('/applications', createMockRepositories({ signedInAs: TEST_VIEWER }));
    await screen.findByRole('link', { name: 'Ödeme Geçidi' });
    expect(screen.queryByRole('button', { name: /^Sil: / })).not.toBeInTheDocument();
  });
});
