import { z } from 'zod';
import { CRITICALITIES } from '@/domains/shared/types';
import {
  documentationLinkSchema,
  roleAssignmentSchema,
  teamAssignmentSchema,
  toDocumentationFormValues,
  toDocumentationLinks,
  toRoleAssignments,
  toRoleFormValues,
  toTeamAssignments,
  toTeamFormValues,
  uniqueRoleAssignments,
} from '@/domains/shared/schemas/sharedFormSchemas';
import {
  childRowId,
  emptyToNull,
  enumChoice,
  idText,
  optionalText,
  optionalUrl,
  optionalWholeNumber,
  requiredChoice,
  requiredText,
  requiredUrl,
  secretFreeText,
  toId,
  toIdOrNull,
  toNumberOrNull,
} from '@/lib/validation';
import {
  APPLICATION_LIFECYCLES,
  OPERATIONAL_STATUSES,
  type Application,
  type ApplicationInput,
} from '../types';

const technologyUsageSchema = z.object({
  id: childRowId,
  technologyId: requiredChoice('bir teknoloji'),
  layer: requiredChoice('bir katman'),
  version: optionalText('Sürüm', 30),
});

const dataStoreSchema = z.object({
  id: childRowId,
  name: requiredText('Veri deposu adı', 80),
  technologyId: requiredChoice('bir teknoloji'),
  purpose: optionalText('Amaç', 300),
  containsPersonalData: z.boolean(),
});

const environmentSchema = z.object({
  id: childRowId,
  type: requiredChoice('bir ortam türü'),
  name: requiredText('Ortam adı', 60),
  url: optionalUrl,
  status: requiredChoice('bir durum'),
  region: optionalText('Bölge', 40),
  notes: secretFreeText('Notlar', 500),
});

const repositorySchema = z.object({
  id: childRowId,
  name: requiredText('Kod deposu adı', 120),
  type: requiredChoice('bir tür'),
  url: requiredUrl('Kod deposu adresi'),
  defaultBranch: requiredText('Varsayılan dal', 60),
  description: optionalText('Açıklama', 300),
});

export const applicationFormSchema = z
  .object({
    name: requiredText('Uygulama adı', 120),
    code: requiredText('Kod', 12).regex(
      /^[A-Z0-9-]+$/,
      'Yalnızca büyük harf, rakam ve kısa çizgi kullanın.',
    ),
    type: requiredChoice('bir uygulama türü'),
    lifecycle: enumChoice(APPLICATION_LIFECYCLES, 'bir yaşam döngüsü aşaması'),
    criticality: enumChoice(CRITICALITIES, 'bir kritiklik'),
    operationalStatus: enumChoice(OPERATIONAL_STATUSES, 'bir çalışma durumu'),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(40)),
    shortDescription: requiredText('Kısa açıklama', 240),
    detailedDescription: optionalText('Ayrıntılı açıklama', 4000),
    businessPurpose: requiredText('İş amacı', 1000),
    businessUnitId: z.string(),
    businessProcesses: z.array(z.string().trim().min(1).max(80)),
    userGroups: z.array(z.string().trim().min(1).max(80)),
    estimatedUserCount: optionalWholeNumber('Tahmini kullanıcı'),
    roles: z.array(roleAssignmentSchema),
    teams: z.array(teamAssignmentSchema),
    technologies: z.array(technologyUsageSchema),
    dataStores: z.array(dataStoreSchema),
    hostingModel: requiredChoice('bir barındırma modeli'),
    cloudProvider: optionalText('Bulut sağlayıcı', 60),
    hostingNotes: secretFreeText('Barındırma notları', 500),
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
          message: 'Bu teknoloji bu katman için zaten listede.',
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
        message: 'Bulut veya hibrit barındırma için bulut sağlayıcıyı belirtin.',
        path: ['cloudProvider'],
      });
    }
  });

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const emptyTechnologyUsage = () => ({
  id: null,
  technologyId: '',
  layer: 'backend' as const,
  version: '',
});
export const emptyDataStore = () => ({
  id: null,
  name: '',
  technologyId: '',
  purpose: '',
  containsPersonalData: false,
});
export const emptyEnvironment = () => ({
  id: null,
  type: 'production' as const,
  name: 'Canlı',
  url: '',
  status: 'available' as const,
  region: '',
  notes: '',
});
export const emptyRepository = () => ({
  id: null,
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
    businessUnitId: idText(app?.businessUnitId),
    businessProcesses: app?.businessProcesses ?? [],
    userGroups: app?.userGroups ?? [],
    estimatedUserCount: app?.estimatedUserCount == null ? '' : String(app.estimatedUserCount),
    roles: toRoleFormValues(app?.roles ?? []),
    teams: toTeamFormValues(app?.teams ?? []),
    technologies: (app?.technologies ?? []).map((usage) => ({
      ...usage,
      technologyId: idText(usage.technologyId),
      version: usage.version ?? '',
    })),
    dataStores: (app?.dataStores ?? []).map((store) => ({
      ...store,
      technologyId: idText(store.technologyId),
    })),
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
    businessUnitId: toIdOrNull(values.businessUnitId),
    businessProcesses: values.businessProcesses,
    userGroups: values.userGroups,
    estimatedUserCount: toNumberOrNull(values.estimatedUserCount),
    roles: toRoleAssignments(values.roles),
    teams: toTeamAssignments(values.teams),
    technologies: values.technologies.map(({ version, technologyId, ...usage }) => ({
      ...usage,
      technologyId: toId(technologyId),
      ...(version.trim() ? { version: version.trim() } : {}),
    })),
    dataStores: values.dataStores.map((store) => ({
      ...store,
      technologyId: toId(store.technologyId),
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
