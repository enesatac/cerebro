import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';
import { createMasterDataIndex } from '../utils/masterDataIndex';

describe('master data page', () => {
  it('renames a value and the new label appears across the site', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/master-data?section=applicationLifecycles');

    const values = await screen.findByRole('list', { name: 'Yaşam döngüsü aşamaları değerleri' });
    const labels = within(values).getAllByRole('textbox', { name: /^Ad/ });
    const active = labels.find((input) => (input as HTMLInputElement).value === 'Aktif');
    if (!active) throw new Error('"Aktif" value not rendered');
    await user.clear(active);
    await user.type(active, 'Canlıda');
    await user.click(screen.getByRole('button', { name: 'Kaydet' }));
    await screen.findByText('Yaşam döngüsü aşamaları güncellendi');

    await router.navigate('/applications');
    const table = await screen.findByRole('table');
    await waitFor(() => expect(within(table).getAllByText('Canlıda').length).toBeGreaterThan(0));
    expect(within(table).queryByText('Aktif')).not.toBeInTheDocument();
  });

  it('is not available to read-only users', async () => {
    renderRoute('/admin/master-data', createMockRepositories({ signedInAs: TEST_VIEWER }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Erişim yetkiniz yok' }),
    ).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Ana menü' });
    expect(within(nav).queryByRole('link', { name: /Ana veriler/ })).not.toBeInTheDocument();
  });
});

describe('master data index', () => {
  const index = createMasterDataIndex([
    {
      key: 'applicationTypes',
      items: [
        { id: 1, code: 'web', label: 'Web', description: '', variant: null, active: true },
        { id: 2, code: 'old', label: 'Eski', description: '', variant: null, active: false },
      ],
    },
  ]);

  it('offers active values and keeps the current inactive one for editing', () => {
    expect(index.options('applicationTypes').map((o) => o.value)).toEqual(['web']);
    expect(index.options('applicationTypes', 'old')).toEqual([
      { value: 'web', label: 'Web' },
      { value: 'old', label: 'Eski (pasif)' },
    ]);
  });

  it('falls back to the code for unknown values', () => {
    expect(index.label('applicationTypes', 'mystery')).toBe('mystery');
    expect(index.badge('applicationTypes', 'web')).toEqual({ label: 'Web', variant: 'neutral' });
  });
});
