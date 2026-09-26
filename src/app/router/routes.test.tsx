import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderWithProviders';

/** Every navigation target renders a real page (no placeholders) with a single h1. */
describe('routes', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/projects', 'Projects'],
    ['/projects/prj-payment-modernisation', 'Payment Platform Modernisation'],
    ['/architecture', 'Connections'],
    ['/teams', 'Teams'],
    ['/teams/team-payments', 'Payments Engineering'],
    ['/technologies', 'Technologies'],
    ['/technologies/tech-kafka', 'Apache Kafka'],
    ['/risks', 'Risks & Escalations'],
    ['/reports', 'Reports'],
  ])('%s renders "%s"', async (path, heading) => {
    renderRoute(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.queryByText(/scheduled for/i)).not.toBeInTheDocument();
  });

  it('shows the dashboard figures and attention list', async () => {
    renderRoute('/');
    expect(await screen.findByRole('region', { name: 'Portfolio overview' })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Roster changes not reaching Flight Ops Portal' }),
    ).toBeInTheDocument();
  });

  it('runs impact analysis for the application in the URL', async () => {
    renderRoute('/architecture?app=app-payment-gateway');
    expect(
      await screen.findByText(/Affected if Payment Gateway is unavailable/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Order Management System' })).toBeInTheDocument(),
    );
  });

  it('shows a not-found state for unknown projects', async () => {
    renderRoute('/projects/prj-missing');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Project not found' }),
    ).toBeInTheDocument();
  });
});
