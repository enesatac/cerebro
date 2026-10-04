import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';
import { THEME_STORAGE_KEY } from './themePreference';

describe('colour mode', () => {
  afterEach(() => window.localStorage.removeItem(THEME_STORAGE_KEY));

  it('switches between light and dark and remembers the choice', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    await user.click(await screen.findByRole('button', { name: 'Koyu temaya geç' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Açık temaya geç' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('starts from the stored choice', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderRoute('/');
    expect(await screen.findByRole('button', { name: 'Açık temaya geç' })).toBeInTheDocument();
  });
});
