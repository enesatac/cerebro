import type { EntityId } from '@/domains/shared/types';

export type TechnologyId = EntityId;

export const TECHNOLOGY_CATEGORIES = [
  'frontend',
  'backend',
  'database',
  'messaging',
  'infrastructure',
  'devops',
  'monitoring',
  'testing',
] as const;
export type TechnologyCategory = (typeof TECHNOLOGY_CATEGORIES)[number];

/** The layer in which an application uses a technology (same vocabulary as categories). */
export type TechnologyLayer = TechnologyCategory;

/** Organisational stance on a technology. */
export const TECHNOLOGY_STATUSES = ['preferred', 'supported', 'deprecated', 'retired'] as const;
export type TechnologyStatus = (typeof TECHNOLOGY_STATUSES)[number];

export interface Technology {
  id: TechnologyId;
  name: string;
  category: TechnologyCategory;
  description: string;
  status: TechnologyStatus;
}

/** Catalogue row with where-used information. */
export interface TechnologyListItem extends Technology {
  /** Applications that record a usage of this technology. */
  applicationCount: number;
  /** Of those, applications that are not retired. */
  activeApplicationCount: number;
}

export type TechnologyInput = Omit<Technology, 'id'>;
