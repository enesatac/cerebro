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
    label: 'Teknik sahip',
    description: 'Teknik sahip rolüne bir kişi atanmış.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => findPrimaryRoleHolder(app.roles, 'technical-owner') !== null,
  },
  {
    id: 'business-owner',
    label: 'İş sahibi',
    description: 'İş sahibi rolüne bir kişi atanmış.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => findPrimaryRoleHolder(app.roles, 'business-owner') !== null,
  },
  {
    id: 'business-unit',
    label: 'İş birimi',
    description: 'Sahip iş birimi belirlenmiş.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => app.businessUnitId !== null,
  },
  {
    id: 'description',
    label: 'Açıklama ve amaç',
    description: 'Kısa açıklama ve iş amacı doldurulmuş.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) =>
      app.shortDescription.trim().length > 0 && app.businessPurpose.trim().length > 0,
  },
  {
    id: 'development-team',
    label: 'Sorumlu ekip',
    description: 'Geliştirme veya destek için en az bir ekip atanmış.',
    importance: 'required',
    weight: 3,
    isSatisfied: (app) => app.teams.length > 0,
  },
  {
    id: 'technologies',
    label: 'Teknolojiler',
    description: 'Teknoloji yığını kaydedilmiş.',
    importance: 'recommended',
    weight: 1,
    appliesTo: (app) => !isVendorHosted(app),
    isSatisfied: (app) => app.technologies.length > 0,
  },
  {
    id: 'repository',
    label: 'Kaynak kod deposu',
    description: 'En az bir kaynak kod deposu bağlanmış.',
    importance: 'recommended',
    weight: 1,
    appliesTo: (app) => !isVendorHosted(app) && !isRetired(app),
    isSatisfied: (app) => app.repositories.length > 0,
  },
  {
    id: 'production-environment',
    label: 'Canlı ortam',
    description: 'Canlı ortam kaydedilmiş.',
    importance: 'recommended',
    weight: 1,
    appliesTo: (app) => !isPreProduction(app) && !isRetired(app),
    isSatisfied: (app) => app.environments.some((env) => env.type === 'production'),
  },
  {
    id: 'documentation',
    label: 'Dokümantasyon',
    description: 'En az bir dokümantasyon bağlantısı kaydedilmiş.',
    importance: 'recommended',
    weight: 1,
    isSatisfied: (app) => app.documentation.length > 0,
  },
];

export function evaluateApplicationCompleteness(application: Application) {
  return evaluateCompleteness(application, APPLICATION_COMPLETENESS_RULES);
}
