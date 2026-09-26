import { z } from 'zod';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  documentationLinkSchema,
  roleAssignmentSchema,
  teamAssignmentSchema,
  toDocumentationFormValues,
  toDocumentationLinks,
  uniqueRoleAssignments,
} from '@/domains/shared/schemas/sharedFormSchemas';
import { TECHNOLOGY_CATEGORIES } from '@/domains/technologies/types';
import {
  emptyToNull,
  enumChoice,
  newRowId,
  optionalText,
  optionalUrl,
  optionalWholeNumber,
  requiredChoice,
  requiredText,
  requiredUrl,
  secretFreeText,
  toNumberOrNull,
} from '@/lib/validation';
import {
  APPLICATION_LIFECYCLES,
  APPLICATION_TYPES,
  ENVIRONMENT_STATUSES,
  ENVIRONMENT_TYPES,
  HOSTING_MODELS,
  OPERATIONAL_STATUSES,
  SOURCE_REPOSITORY_TYPES,
  type Application,
  type ApplicationInput,
} from '../types';

const technologyUsageSchema = z.object({
  technologyId: requiredChoice('a technology'),
  layer: enumChoice(TECHNOLOGY_CATEGORIES, 'a layer'),
  version: optionalText('Version', 30),
});

const dataStoreSchema = z.object({
  id: z.string(),
  name: requiredText('Data store name', 80),
  technologyId: requiredChoice('a technology'),
  purpose: optionalText('Purpose', 300),
  containsPersonalData: z.boolean(),
});

const environmentSchema = z.object({
  id: z.string(),
  type: enumChoice(ENVIRONMENT_TYPES, 'an environment type'),
  name: requiredText('Environment name', 60),
  url: optionalUrl,
  status: enumChoice(ENVIRONMENT_STATUSES, 'a status'),
  region: optionalText('Region', 40),
  notes: secretFreeText('Notes', 500),
});

const repositorySchema = z.object({
  id: z.string(),
  name: requiredText('Repository name', 120),
  type: enumChoice(SOURCE_REPOSITORY_TYPES, 'a type'),
  url: requiredUrl('Repository address'),
  defaultBranch: requiredText('Default branch', 60),
  description: optionalText('Description', 300),
});

export const applicationFormSchema = z
  .object({
    name: requiredText('Application name', 120),
    code: requiredText('Code', 12).regex(
      /^[A-Z0-9-]+$/,
      'Use capital letters, digits and hyphens only.',
    ),
    type: enumChoice(APPLICATION_TYPES, 'an application type'),
    lifecycle: enumChoice(APPLICATION_LIFECYCLES, 'a lifecycle stage'),
    criticality: enumChoice(CRITICALITIES, 'a criticality'),
    operationalStatus: enumChoice(OPERATIONAL_STATUSES, 'an operational status'),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(40)),
    shortDescription: requiredText('Short description', 240),
    detailedDescription: optionalText('Detailed description', 4000),
    businessPurpose: requiredText('Business purpose', 1000),
    businessUnitId: z.string(),
    businessProcesses: z.array(z.string().trim().min(1).max(80)),
    userGroups: z.array(z.string().trim().min(1).max(80)),
    estimatedUserCount: optionalWholeNumber('Estimated users'),
    roles: z.array(roleAssignmentSchema),
    teams: z.array(teamAssignmentSchema),
    technologies: z.array(technologyUsageSchema),
    dataStores: z.array(dataStoreSchema),
    hostingModel: enumChoice(HOSTING_MODELS, 'a hosting model'),
    cloudProvider: optionalText('Cloud provider', 60),
    hostingNotes: secretFreeText('Hosting notes', 500),
    environments: z.array(environmentSchema),
    repositories: z.array(repositorySchema),
    documentation: z.array(documentationLinkSchema),
  })
  .superRefine((values, ctx) => {
    uniqueRoleAssignments(values.roles, ctx);
    const seen = new Set<string>();
    values.technologies.forEach((usage, index) => {
      const key = `${usage.technologyId}:${usage.layer}`;
      if (usage.technologyId && seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          message: 'This technology is already listed for this layer.',
          path: ['technologies', index, 'technologyId'],
        });
      }
      seen.add(key);
    });
    if (
      (values.hostingModel === 'public-cloud' || values.hostingModel === 'hybrid') &&
      !values.cloudProvider.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Name the cloud provider for cloud or hybrid hosting.',
        path: ['cloudProvider'],
      });
    }
  });

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const emptyTechnologyUsage = () => ({
  technologyId: '',
  layer: 'backend' as const,
  version: '',
});
export const emptyDataStore = () => ({
  id: newRowId('ds'),
  name: '',
  technologyId: '',
  purpose: '',
  containsPersonalData: false,
});
export const emptyEnvironment = () => ({
  id: newRowId('env'),
  type: 'production' as const,
  name: 'Production',
  url: '',
  status: 'available' as const,
  region: '',
  notes: '',
});
export const emptyRepository = () => ({
  id: newRowId('repo'),
  name: '',
  type: 'backend' as const,
  url: '',
  defaultBranch: 'main',
  description: '',
});

export function toApplicationFormValues(app?: Application): ApplicationFormValues {
  return {
    name: app?.name ?? '',
    code: app?.code ?? '',
    type: app?.type ?? 'web-application',
    lifecycle: app?.lifecycle ?? 'planned',
    criticality: app?.criticality ?? 'medium',
    operationalStatus: app?.operationalStatus ?? 'not-deployed',
    tags: app?.tags ?? [],
    shortDescription: app?.shortDescription ?? '',
    detailedDescription: app?.detailedDescription ?? '',
    businessPurpose: app?.businessPurpose ?? '',
    businessUnitId: app?.businessUnitId ?? '',
    businessProcesses: app?.businessProcesses ?? [],
    userGroups: app?.userGroups ?? [],
    estimatedUserCount: app?.estimatedUserCount == null ? '' : String(app.estimatedUserCount),
    roles: app?.roles ?? [],
    teams: app?.teams ?? [],
    technologies: (app?.technologies ?? []).map((usage) => ({
      ...usage,
      version: usage.version ?? '',
    })),
    dataStores: app?.dataStores ?? [],
    hostingModel: app?.hosting.model ?? 'public-cloud',
    cloudProvider: app?.hosting.cloudProvider ?? '',
    hostingNotes: app?.hosting.notes ?? '',
    environments: (app?.environments ?? []).map((env) => ({
      ...env,
      url: env.url ?? '',
      region: env.region ?? '',
      notes: env.notes ?? '',
    })),
    repositories: (app?.repositories ?? []).map((repo) => ({
      ...repo,
      description: repo.description ?? '',
    })),
    documentation: toDocumentationFormValues(app?.documentation ?? []),
  };
}

export function toApplicationInput(values: ApplicationFormValues): ApplicationInput {
  const trim = (text: string) => text.trim();
  return {
    name: trim(values.name),
    code: trim(values.code),
    shortDescription: trim(values.shortDescription),
    detailedDescription: trim(values.detailedDescription),
    businessPurpose: trim(values.businessPurpose),
    type: values.type,
    lifecycle: values.lifecycle,
    criticality: values.criticality,
    operationalStatus: values.operationalStatus,
    tags: [...new Set(values.tags)],
    businessUnitId: emptyToNull(values.businessUnitId),
    businessProcesses: values.businessProcesses,
    userGroups: values.userGroups,
    estimatedUserCount: toNumberOrNull(values.estimatedUserCount),
    roles: values.roles,
    teams: values.teams,
    technologies: values.technologies.map(({ version, ...usage }) =>
      version.trim() ? { ...usage, version: version.trim() } : usage,
    ),
    dataStores: values.dataStores.map((store) => ({
      ...store,
      name: trim(store.name),
      purpose: trim(store.purpose),
    })),
    hosting: {
      model: values.hostingModel,
      cloudProvider: emptyToNull(values.cloudProvider),
      ...(values.hostingNotes.trim() ? { notes: values.hostingNotes.trim() } : {}),
    },
    environments: values.environments.map(({ notes, ...env }) => ({
      ...env,
      name: trim(env.name),
      url: emptyToNull(env.url),
      region: emptyToNull(env.region),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    })),
    repositories: values.repositories.map(({ description, ...repo }) => ({
      ...repo,
      name: trim(repo.name),
      url: trim(repo.url),
      ...(description.trim() ? { description: description.trim() } : {}),
    })),
    documentation: toDocumentationLinks(values.documentation),
  };
}
