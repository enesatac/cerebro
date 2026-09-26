import { z } from 'zod';
import {
  documentationLinkSchema,
  roleAssignmentSchema,
  teamAssignmentSchema,
  toDocumentationFormValues,
  toDocumentationLinks,
  uniqueRoleAssignments,
} from '@/domains/shared/schemas/sharedFormSchemas';
import {
  emptyToNull,
  enumChoice,
  newRowId,
  optionalDate,
  optionalText,
  optionalWholeNumber,
  requiredChoice,
  requiredDate,
  requiredText,
  toNumberOrNull,
} from '@/lib/validation';
import {
  APPLICATION_IMPACT_TYPES,
  CONFIDENTIALITY_LEVELS,
  MILESTONE_STATUSES,
  PROJECT_HEALTHS,
  PROJECT_PHASES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type Milestone,
  type Project,
  type ProjectInput,
} from '../types';

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'TRY'] as const;

const milestoneSchema = z.object({
  id: z.string(),
  title: requiredText('Milestone', 160),
  dueDate: requiredDate('Due date'),
  status: enumChoice(MILESTONE_STATUSES, 'a status'),
  completedDate: optionalDate,
});

const impactSchema = z.object({
  applicationId: requiredChoice('an application'),
  impactType: enumChoice(APPLICATION_IMPACT_TYPES, 'an impact'),
  description: optionalText('What changes', 300),
});

export const projectFormSchema = z
  .object({
    name: requiredText('Project name', 160),
    code: requiredText('Code', 12).regex(
      /^[A-Z0-9-]+$/,
      'Use capital letters, digits and hyphens only.',
    ),
    shortName: optionalText('Short name', 60),
    type: enumChoice(PROJECT_TYPES, 'a project type'),
    priority: enumChoice(PROJECT_PRIORITIES, 'a priority'),
    status: enumChoice(PROJECT_STATUSES, 'a status'),
    health: enumChoice(PROJECT_HEALTHS, 'a health'),
    confidentiality: enumChoice(CONFIDENTIALITY_LEVELS, 'a confidentiality level'),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(40)),
    description: requiredText('Description', 1000),
    objective: optionalText('Objective', 1000),
    scope: optionalText('Scope', 2000),
    outOfScope: optionalText('Out of scope', 2000),
    businessUnitId: z.string(),
    roles: z.array(roleAssignmentSchema),
    teams: z.array(teamAssignmentSchema),
    plannedStartDate: optionalDate,
    actualStartDate: optionalDate,
    plannedEndDate: optionalDate,
    actualEndDate: optionalDate,
    progressPercentage: optionalWholeNumber('Progress', { min: 0, max: 100 }).refine(
      (v) => v !== '',
      'Progress is required.',
    ),
    currentPhase: enumChoice(PROJECT_PHASES, 'a phase'),
    latestStatusSummary: optionalText('Status summary', 1000),
    nextSteps: optionalText('Next steps', 1000),
    hasFinancials: z.boolean(),
    currency: z.enum(CURRENCIES),
    budget: optionalWholeNumber('Budget'),
    actualCost: optionalWholeNumber('Actual cost'),
    forecastCost: optionalWholeNumber('Forecast cost'),
    applicationImpacts: z.array(impactSchema),
    milestones: z.array(milestoneSchema),
    documentation: z.array(documentationLinkSchema),
  })
  .superRefine((values, ctx) => {
    uniqueRoleAssignments(values.roles, ctx);
    if (
      values.plannedStartDate &&
      values.plannedEndDate &&
      values.plannedEndDate < values.plannedStartDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Planned end must be after planned start.',
        path: ['plannedEndDate'],
      });
    }
    if (
      values.actualEndDate &&
      values.actualStartDate &&
      values.actualEndDate < values.actualStartDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Actual end must be after actual start.',
        path: ['actualEndDate'],
      });
    }
    if (values.status === 'completed' && values.progressPercentage !== '100') {
      ctx.addIssue({
        code: 'custom',
        message: 'A completed project should be 100% complete.',
        path: ['progressPercentage'],
      });
    }
    const seen = new Set<string>();
    values.applicationImpacts.forEach((impact, index) => {
      if (impact.applicationId && seen.has(impact.applicationId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'This application is already listed.',
          path: ['applicationImpacts', index, 'applicationId'],
        });
      }
      seen.add(impact.applicationId);
    });
    values.milestones.forEach((milestone, index) => {
      if (milestone.status === 'completed' && !milestone.completedDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter the completion date.',
          path: ['milestones', index, 'completedDate'],
        });
      }
    });
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type MilestoneFormValues = z.infer<typeof milestoneSchema>;

export const emptyMilestone = (): MilestoneFormValues => ({
  id: newRowId('ms'),
  title: '',
  dueDate: '',
  status: 'planned',
  completedDate: '',
});

export const emptyImpact = () => ({
  applicationId: '',
  impactType: 'modifies' as const,
  description: '',
});

const numberText = (value: number | null | undefined) => (value == null ? '' : String(value));

export function toProjectFormValues(project?: Project): ProjectFormValues {
  const financials = project?.financials;
  return {
    name: project?.name ?? '',
    code: project?.code ?? '',
    shortName: project?.shortName ?? '',
    type: project?.type ?? 'modernisation',
    priority: project?.priority ?? 'medium',
    status: project?.status ?? 'proposed',
    health: project?.health ?? 'on-track',
    confidentiality: project?.confidentiality ?? 'internal',
    tags: project?.tags ?? [],
    description: project?.description ?? '',
    objective: project?.objective ?? '',
    scope: project?.scope ?? '',
    outOfScope: project?.outOfScope ?? '',
    businessUnitId: project?.businessUnitId ?? '',
    roles: project?.roles ?? [],
    teams: project?.teams ?? [],
    plannedStartDate: project?.timeline.plannedStartDate ?? '',
    actualStartDate: project?.timeline.actualStartDate ?? '',
    plannedEndDate: project?.timeline.plannedEndDate ?? '',
    actualEndDate: project?.timeline.actualEndDate ?? '',
    progressPercentage: String(project?.progressPercentage ?? 0),
    currentPhase: project?.currentPhase ?? 'initiation',
    latestStatusSummary: project?.latestStatusSummary ?? '',
    nextSteps: project?.nextSteps ?? '',
    hasFinancials: Boolean(financials),
    currency: (CURRENCIES as readonly string[]).includes(financials?.currency ?? '')
      ? (financials?.currency as (typeof CURRENCIES)[number])
      : 'EUR',
    budget: numberText(financials?.budget),
    actualCost: numberText(financials?.actualCost),
    forecastCost: numberText(financials?.forecastCost),
    applicationImpacts: project?.applicationImpacts ?? [],
    milestones: (project?.milestones ?? []).map((m: Milestone) => ({
      ...m,
      completedDate: m.completedDate ?? '',
    })),
    documentation: toDocumentationFormValues(project?.documentation ?? []),
  };
}

export function toProjectInput(values: ProjectFormValues): ProjectInput {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    shortName: values.shortName.trim() || values.name.trim(),
    description: values.description.trim(),
    objective: values.objective.trim(),
    scope: values.scope.trim(),
    outOfScope: values.outOfScope.trim(),
    type: values.type,
    priority: values.priority,
    status: values.status,
    health: values.health,
    confidentiality: values.confidentiality,
    tags: [...new Set(values.tags)],
    businessUnitId: emptyToNull(values.businessUnitId),
    roles: values.roles,
    teams: values.teams,
    timeline: {
      plannedStartDate: emptyToNull(values.plannedStartDate),
      actualStartDate: emptyToNull(values.actualStartDate),
      plannedEndDate: emptyToNull(values.plannedEndDate),
      actualEndDate: emptyToNull(values.actualEndDate),
    },
    progressPercentage: Number(values.progressPercentage),
    currentPhase: values.currentPhase,
    latestStatusSummary: values.latestStatusSummary.trim(),
    nextSteps: values.nextSteps.trim(),
    financials: values.hasFinancials
      ? {
          currency: values.currency,
          budget: toNumberOrNull(values.budget),
          actualCost: toNumberOrNull(values.actualCost),
          forecastCost: toNumberOrNull(values.forecastCost),
        }
      : null,
    applicationImpacts: values.applicationImpacts.map((impact) => ({
      ...impact,
      description: impact.description.trim(),
    })),
    milestones: values.milestones.map((m) => ({
      ...m,
      title: m.title.trim(),
      completedDate: emptyToNull(m.completedDate),
    })),
    documentation: toDocumentationLinks(values.documentation),
  };
}
