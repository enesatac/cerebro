import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

describe('leaves page', () => {
  it('shows people down the side with their leaves as bars', async () => {
    renderRoute('/leaves?date=2026-10-01');
    const calendar = await screen.findByRole('region', { name: 'İzin takvimi' });
    expect(within(calendar).getByRole('rowheader', { name: /Jonas Berg/ })).toBeInTheDocument();
    expect(
      await within(calendar).findByRole('button', {
        name: /Jonas Berg: Yıllık izin, 5–16 Eki 2026/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'İzin ekle' })).toBeInTheDocument();
  });

  it('filters to one type and opens the list view', async () => {
    const user = userEvent.setup();
    renderRoute('/leaves?date=2026-10-01&type=sick&away=1&tab=list');
    const table = await screen.findByRole('table');
    expect(await within(table).findByText('Priya Raman')).toBeInTheDocument();
    expect(within(table).queryByText('Jonas Berg')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Takvim/ }));
    expect(await screen.findByRole('region', { name: 'İzin takvimi' })).toBeInTheDocument();
  });

  it('is read-only for regular users', async () => {
    renderRoute('/leaves?date=2026-10-01', createMockRepositories({ signedInAs: TEST_VIEWER }));
    await screen.findByRole('region', { name: 'İzin takvimi' });
    expect(screen.queryByRole('button', { name: 'İzin ekle' })).not.toBeInTheDocument();
  });
});
