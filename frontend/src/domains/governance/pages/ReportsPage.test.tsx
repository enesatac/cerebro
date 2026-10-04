import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';

describe('reports page', () => {
  it('opens on portfolio charts with headline numbers and drill-down bars', async () => {
    renderRoute('/reports');
    expect(
      await screen.findByRole('heading', { name: 'Aylık aktif proje sayısı' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /Aylık aktif proje sayısı\. Ayları ok tuşlarıyla/ }),
    ).toBeInTheDocument();
    const statuses = screen.getByRole('list', { name: 'Projeler, duruma göre' });
    expect(within(statuses).getByRole('link', { name: /Devam ediyor/ })).toHaveAttribute(
      'href',
      '/projects?status=in-progress',
    );
  });

  it('shows every chart value as a table on request', async () => {
    const user = userEvent.setup();
    renderRoute('/reports?tab=operations&period=24');
    const heading = await screen.findByRole('heading', { name: 'Aylık açılan eskalasyonlar' });
    const card = heading.closest('.c-section-card') as HTMLElement;
    await user.click(
      within(card).getByRole('button', { name: 'Tablo: Aylık açılan eskalasyonlar' }),
    );
    const table = within(card).getByRole('table');
    // 24 months plus the header row.
    expect(within(table).getAllByRole('row')).toHaveLength(25);
    expect(within(table).getByRole('columnheader', { name: 'Toplam' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /satırlar olasılık/ })).toBeInTheDocument();
  });

  it('reads a month aloud from the keyboard', async () => {
    const user = userEvent.setup();
    renderRoute('/reports?tab=resources');
    const chart = await screen.findByRole('group', { name: /Aylık aşırı yüklü kişi sayısı\./ });
    await user.click(chart);
    chart.focus();
    await user.keyboard('{ArrowRight}');
    expect(within(chart).getByText('Aşırı yüklü kişi')).toBeInTheDocument();
    expect(within(chart).getByText(/· plan/)).toBeInTheDocument();
  });
});
