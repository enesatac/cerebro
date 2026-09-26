import type { CompletenessRule } from '@/domains/governance/types';
import { evaluateCompleteness } from '@/domains/governance/utils/completeness';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import type { Application } from '../types';

const isVendorHosted = (app: Application) => app.hosting.model === 'saas';
const isPreProduction = (app: Application) =>
  app.lifecycle === 'planned' || app.lifecycle === 'development';
const isRetired = (app: Application) => app.lifecycle === 'retired';

/**
 * Rules behind the application completeness indicator. Weights: required rules carry 3,
 * recommended rules 1 — a missing owner matters more than a missing dashboard link.
 */
export const APPLICATION_COMPLETENESS_RULES: CompletenessRule<Application>[] = [
  {
    id: 'technical-owner',
    label: 'Technical owner',
    description: 'A person is assigned the technical owner role.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => findPrimaryRoleHolder(app.roles, 'technical-owner') !== null,
  },
  {
    id: 'business-owner',
    label: 'Business owner',
    description: 'A person is assigned the business owner role.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => findPrimaryRoleHolder(app.roles, 'business-owner') !== null,
  },
  {
    id: 'business-unit',
    label: 'Business unit',
    description: 'The owning business unit is set.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => app.businessUnitId !== null,
  },
  {
    id: 'description',
    label: 'Description and purpose',
    description: 'Short description and business purpose are filled in.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) =>
      app.shortDescription.trim().length > 0 && app.businessPurpose.trim().length > 0,
  },
  {
    id: 'development-team',
    label: 'Responsible team',
    description: 'At least one team is assigned for development or support.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => app.teams.length > 0,
  },
  {
    id: 'technologies',
    label: 'Technologies',
    description: 'The technology stack is recorded.',
    importance: 'recommended',
    weight: 1,
    appliesTo: (app) => !isVendorHosted(app),
    isSatisfied: (app) => app.technologies.length > 0,
  },
  {
    id: 'repository',
    label: 'Source repository',
    description: 'At least one source repository is linked.',
    importance: 'recommended',
    weight: 1,
    appliesTo: (app) => !isVendorHosted(app) && !isRetired(app),
    isSatisfied: (app) => app.repositories.length > 0,
  },
  {
    id: 'production-environment',
    label: 'Production environment',
    description: 'A production environment is recorded.',
    importance: 'recommended',
    weight: 1,
    appliesTo: (app) => !isPreProduction(app) && !isRetired(app),
    isSatisfied: (app) => app.environments.some((env) => env.type === 'production'),
  },
  {
    id: 'documentation',
    label: 'Documentation',
    description: 'At least one documentation link is recorded.',
    importance: 'recommended',
    weight: 1,
    isSatisfied: (app) => app.documentation.length > 0,
  },
];

export function evaluateApplicationCompleteness(application: Application) {
  return evaluateCompleteness(application, APPLICATION_COMPLETENESS_RULES);
}
