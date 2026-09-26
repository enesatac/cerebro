import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { ChipsField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import {
  CURRENCIES,
  emptyImpact,
  emptyMilestone,
  type ProjectFormValues,
} from '../../schemas/projectForm';
import {
  APPLICATION_IMPACT_TYPES,
  CONFIDENTIALITY_LEVELS,
  MILESTONE_STATUSES,
  PROJECT_HEALTHS,
  PROJECT_PHASES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '../../types';
import {
  APPLICATION_IMPACT_LABELS,
  CONFIDENTIALITY_LABELS,
  MILESTONE_STATUS_PRESENTATION,
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_PRESENTATION,
  PROJECT_TYPE_LABELS,
} from '../../utils/projectPresentation';

type Props = { control: Control<ProjectFormValues> };

const options = <T extends string>(values: readonly T[], label: (value: T) => string) =>
  values.map((value) => ({ value, label: label(value) }));

export function ProjectGeneralSection({ control }: Props) {
  const businessUnits = useBusinessUnitOptions();
  return (
    <SectionCard title="General">
      <div className="c-form-grid c-form-grid--three">
        <TextField
          control={control}
          name="name"
          label="Project name"
          required
          className="c-form-grid__wide"
        />
        <TextField
          control={control}
          name="code"
          label="Code"
          required
          description="Short unique code, e.g. PPM."
        />
        <TextField control={control} name="shortName" label="Short name" />
        <SelectField
          control={control}
          name="businessUnitId"
          label="Business unit"
          options={businessUnits}
          emptyLabel="Not set"
        />
        <SelectField
          control={control}
          name="type"
          label="Type"
          required
          options={options(PROJECT_TYPES, (v) => PROJECT_TYPE_LABELS[v])}
        />
        <SelectField
          control={control}
          name="status"
          label="Status"
          required
          options={options(PROJECT_STATUSES, (v) => PROJECT_STATUS_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="health"
          label="Health"
          required
          options={options(PROJECT_HEALTHS, (v) => PROJECT_HEALTH_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="priority"
          label="Priority"
          required
          options={options(PROJECT_PRIORITIES, (v) => CRITICALITY_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="confidentiality"
          label="Confidentiality"
          required
          options={options(CONFIDENTIALITY_LEVELS, (v) => CONFIDENTIALITY_LABELS[v])}
        />
        <ChipsField control={control} name="tags" label="Tags" className="c-form-grid__wide" />
      </div>
      <div className="c-stack c-form-stack">
        <TextField control={control} name="description" label="Description" rows={2} required />
        <TextField control={control} name="objective" label="Objective" rows={2} />
        <div className="c-form-grid">
          <TextField control={control} name="scope" label="Scope" rows={3} />
          <TextField control={control} name="outOfScope" label="Out of scope" rows={3} />
        </div>
      </div>
    </SectionCard>
  );
}

export function ProjectProgressSection({ control }: Props) {
  return (
    <SectionCard title="Timeline & progress">
      <div className="c-form-grid c-form-grid--four">
        <DateField control={control} name="plannedStartDate" label="Planned start" />
        <DateField control={control} name="plannedEndDate" label="Planned end" />
        <DateField control={control} name="actualStartDate" label="Actual start" />
        <DateField control={control} name="actualEndDate" label="Actual end" />
        <SelectField
          control={control}
          name="currentPhase"
          label="Current phase"
          required
          options={options(PROJECT_PHASES, (v) => PROJECT_PHASE_LABELS[v])}
        />
        <TextField
          control={control}
          name="progressPercentage"
          label="Progress (%)"
          type="number"
          required
        />
      </div>
      <div className="c-form-grid c-form-stack">
        <TextField
          control={control}
          name="latestStatusSummary"
          label="Latest status summary"
          rows={3}
        />
        <TextField control={control} name="nextSteps" label="Next steps" rows={3} />
      </div>
    </SectionCard>
  );
}

export function ProjectFinancialsSection({ control }: Props) {
  const enabled = useWatch({ control, name: 'hasFinancials' });
  return (
    <SectionCard
      title="Financials"
      description="Optional. Budget figures may become restricted to authorised roles."
    >
      <SwitchField
        control={control}
        name="hasFinancials"
        label="Track financials for this project"
      />
      {enabled && (
        <div className="c-form-grid c-form-grid--four c-form-stack">
          <SelectField
            control={control}
            name="currency"
            label="Currency"
            required
            options={CURRENCIES.map((value) => ({ value, label: value }))}
          />
          <TextField control={control} name="budget" label="Budget" type="number" />
          <TextField control={control} name="actualCost" label="Actual cost" type="number" />
          <TextField control={control} name="forecastCost" label="Forecast cost" type="number" />
        </div>
      )}
    </SectionCard>
  );
}

export function ProjectApplicationsSection({ control }: Props) {
  const applications = useApplicationOptions();
  const { fields, append, remove } = useFieldArray({ control, name: 'applicationImpacts' });
  return (
    <SectionCard
      title="Affected applications"
      description="Applications this project creates, modifies, integrates with or decommissions."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyImpact())}
        onRemove={remove}
        addLabel="Add application"
        removeLabel={(index) => `Remove affected application ${index + 1}`}
        emptyText="No applications linked yet."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <SelectField
              control={control}
              name={`applicationImpacts.${index}.applicationId`}
              label="Application"
              required
              options={applications}
            />
            <SelectField
              control={control}
              name={`applicationImpacts.${index}.impactType`}
              label="Impact"
              required
              options={options(APPLICATION_IMPACT_TYPES, (v) => APPLICATION_IMPACT_LABELS[v])}
            />
            <TextField
              control={control}
              name={`applicationImpacts.${index}.description`}
              label="What changes"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}

export function ProjectMilestonesSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });
  return (
    <SectionCard title="Milestones">
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyMilestone())}
        onRemove={remove}
        addLabel="Add milestone"
        removeLabel={(index) => `Remove milestone ${index + 1}`}
        emptyText="No milestones defined yet."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--four">
            <TextField
              control={control}
              name={`milestones.${index}.title`}
              label="Milestone"
              required
            />
            <DateField
              control={control}
              name={`milestones.${index}.dueDate`}
              label="Due"
              required
            />
            <SelectField
              control={control}
              name={`milestones.${index}.status`}
              label="Status"
              required
              options={options(MILESTONE_STATUSES, (v) => MILESTONE_STATUS_PRESENTATION[v].label)}
            />
            <DateField
              control={control}
              name={`milestones.${index}.completedDate`}
              label="Completed"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}
