import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

describe('person page', () => {
  it('opens from a team member and shows the person’s work on one screen', async () => {
    const user = userEvent.setup();
    renderRoute('/teams/1', createMockRepositories({ signedInAs: TEST_VIEWER }));
    await screen.findByRole('heading', { name: /Üyeler/ });
    // Aylin manages the team and is a member: the last link is the one in the member list.
    const links = screen.getAllByRole('link', { name: 'Aylin Demir' });
    const member = links.at(-1);
    if (!member) throw new Error('member link missing');
    await user.click(member);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Aylin Demir' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Uygulamalar \(\d+\)/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Bildirim Servisi' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Teknik sahip').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Eskalasyonlar \(\d+\)/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /İzinler \(\d+\)/ })).toBeInTheDocument();
  });

  it('shows "not found" for an unknown person', async () => {
    renderRoute('/people/999999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kişi bulunamadı' }),
    ).toBeInTheDocument();
  });
});
