import type { ApplicationHealthRow, PortfolioOverview } from '../types';

/** Portfolio-wide aggregates. A backend would compute these server-side. */
export interface GovernanceRepository {
  getPortfolioOverview(): Promise<PortfolioOverview>;
  getApplicationHealthReport(): Promise<ApplicationHealthRow[]>;
}
