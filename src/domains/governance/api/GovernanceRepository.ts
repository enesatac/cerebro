import type { IsoDate } from '@/domains/shared/types';
import type {
  ApplicationHealthRow,
  PortfolioOverview,
  PortfolioTrends,
  ReportPeriod,
} from '../types';

/** Portfolio-wide aggregates. A backend would compute these server-side. */
export interface GovernanceRepository {
  getPortfolioOverview(): Promise<PortfolioOverview>;
  getApplicationHealthReport(): Promise<ApplicationHealthRow[]>;
  /** Monthly series and current distributions for the report charts. */
  getTrends(period: ReportPeriod, today: IsoDate): Promise<PortfolioTrends>;
}
