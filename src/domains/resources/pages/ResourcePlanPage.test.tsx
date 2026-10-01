import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

describe('resource plan page', () => {
  it('shows each person’s parallel allocations and flags over-allocation', async () => {
    renderRoute('/resources?date=2026-10-01&q=lucas');
    const plan = await screen.findByRole('region', { name: 'Kaynak planı' });
    const row = within(plan).getByRole('rowheader', { name: /Lucas Moreau/ });
    expect(row).toBeInTheDocument();
    const bars = await within(plan).findAllByRole('button', { name: /^Lucas Moreau: / });
    expect(bars.length).toBeGreaterThanOrEqual(3);
    expect(
      within(plan).getByRole('button', {
        name: /Sadakat Programı Lansmanı, Proje yöneticisi, %40/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kaynak ata' })).toBeInTheDocument();
  });

  it('filters to over-allocated people and lists allocations as a table', async () => {
    const user = userEvent.setup();
    renderRoute('/resources?date=2026-10-01&over=1&tab=list');
    const table = await screen.findByRole('table');
    expect(await within(table).findAllByText('Lucas Moreau')).not.toHaveLength(0);
    expect(within(table).queryByText('Ahmed Nasser')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Zaman çizelgesi/ }));
    expect(await screen.findByRole('region', { name: 'Kaynak planı' })).toBeInTheDocument();
  });

  it('warns about over-allocation before saving a new allocation', async () => {
    const user = userEvent.setup();
    renderRoute('/resources?date=2026-10-01');
    await user.click(await screen.findByRole('button', { name: 'Kaynak ata' }));
    const dialog = await screen.findByRole('dialog', { name: 'Kaynak ata' });
    await user.click(within(dialog).getByRole('combobox', { name: /Kişi/ }));
    await user.click(await screen.findByRole('option', { name: /Lucas Moreau/ }));
    await user.click(within(dialog).getByRole('combobox', { name: /^Proje\*?$/ }));
    await user.click(await screen.findByRole('option', { name: /Operasyonel Dayanıklılık/ }));
    expect(await within(dialog).findByText(/Aşırı yük: en fazla %/)).toBeInTheDocument();
  });

  it('is read-only for regular users', async () => {
    renderRoute('/resources?date=2026-10-01', createMockRepositories({ signedInAs: TEST_VIEWER }));
    await screen.findByRole('region', { name: 'Kaynak planı' });
    expect(screen.queryByRole('button', { name: 'Kaynak ata' })).not.toBeInTheDocument();
  });
});
