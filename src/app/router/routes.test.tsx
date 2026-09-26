import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';

/** Every navigation target renders a real page (no placeholders) with a single h1. */
describe('routes', () => {
  it.each([
    ['/', 'Gösterge paneli'],
    ['/projects', 'Projeler'],
    ['/projects/prj-payment-modernisation', 'Ödeme Platformu Modernizasyonu'],
    ['/architecture', 'Bağlantılar'],
    ['/teams', 'Ekipler'],
    ['/teams/team-payments', 'Ödeme Mühendisliği'],
    ['/technologies', 'Teknolojiler'],
    ['/technologies/tech-kafka', 'Apache Kafka'],
    ['/risks', 'Riskler ve Eskalasyonlar'],
    ['/reports', 'Raporlar'],
  ])('%s renders "%s"', async (path, heading) => {
    renderRoute(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.queryByText(/scheduled for/i)).not.toBeInTheDocument();
  });

  it('shows the dashboard figures and attention list', async () => {
    renderRoute('/');
    expect(await screen.findByRole('region', { name: 'Portföy özeti' })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', {
        name: "Çizelge değişiklikleri Uçuş Operasyon Portalı'na ulaşmıyor",
      }),
    ).toBeInTheDocument();
  });

  it('runs impact analysis for the application in the URL', async () => {
    renderRoute('/architecture?app=app-payment-gateway');
    expect(await screen.findByText(/Ödeme Geçidi erişilemezse etkilenenler/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Sipariş Yönetim Sistemi' })).toBeInTheDocument(),
    );
  });

  it('shows a not-found state for unknown projects', async () => {
    renderRoute('/projects/prj-missing');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Proje bulunamadı' }),
    ).toBeInTheDocument();
  });
});
