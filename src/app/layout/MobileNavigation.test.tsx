import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';

describe('mobile navigation', () => {
  it('opens the menu drawer and closes it after navigating', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');
    await user.click(await screen.findByRole('button', { name: 'Menüyü aç' }));
    const drawer = await screen.findByRole('dialog', { name: 'Cerebro' });
    const link = (await screen.findAllByRole('link', { name: /Ekipler/ })).find((candidate) =>
      drawer.contains(candidate),
    );
    if (!link) throw new Error('drawer has no Ekipler link');
    await user.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams'));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Cerebro' })).not.toBeInTheDocument(),
    );
  });
});
