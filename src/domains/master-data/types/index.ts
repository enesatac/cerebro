import type { BadgeVariant } from '@takeoff-ui/react-spar';

/**
 * Every administrable value list. The key is stable (stored nowhere in records — records store the
 * item `code`), so it can be used in URLs and API paths.
 */
export const MASTER_DATA_LIST_KEYS = [
  'applicationLifecycles',
  'applicationTypes',
  'operationalStatuses',
  'hostingModels',
  'environmentTypes',
  'environmentStatuses',
  'sourceRepositoryTypes',
  'technologyCategories',
  'technologyStatuses',
  'projectStatuses',
  'projectHealths',
  'projectTypes',
  'projectPhases',
  'milestoneStatuses',
  'applicationImpactTypes',
  'confidentialityLevels',
  'currencies',
  'criticalities',
  'stakeholderRoles',
  'teamResponsibilities',
  'documentationLinkTypes',
  'riskCategories',
  'riskStatuses',
  'escalationStatuses',
  'decisionStatuses',
  'dependencyTypes',
  'integrationTypes',
  'integrationFrequencies',
] as const;
export type MasterDataListKey = (typeof MASTER_DATA_LIST_KEYS)[number];

/** Badge colours an administrator may pick for coloured lists (Takeoff `Badge` variants). */
export const MASTER_DATA_VARIANTS = [
  'neutral',
  'info',
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'purple',
  'cyan',
  'teal',
  'business',
  'dark',
] as const satisfies readonly BadgeVariant[];
export type MasterDataVariant = (typeof MASTER_DATA_VARIANTS)[number];

/** One value of a list. Records store `code`; everything else is presentation an admin can edit. */
export interface MasterDataItem {
  code: string;
  label: string;
  description: string;
  /** Badge colour; `null` for lists that are shown as plain text. */
  variant: MasterDataVariant | null;
  /** Inactive values stay readable on existing records but are not offered for new input. */
  active: boolean;
}

export interface MasterDataList {
  key: MasterDataListKey;
  /** Display order is the array order. */
  items: MasterDataItem[];
}

/** Records using each code of a list, e.g. `{ 'web-application': 4 }`. */
export type MasterDataUsage = Record<string, number>;
