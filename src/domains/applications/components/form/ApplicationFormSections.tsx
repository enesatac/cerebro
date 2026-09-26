import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { ChipsField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTechnologyOptions } from '@/domains/technologies/api/queries';
import { TECHNOLOGY_CATEGORIES } from '@/domains/technologies/types';
import { TECHNOLOGY_CATEGORY_LABELS } from '@/domains/technologies/utils/technologyPresentation';
import {
  emptyDataStore,
  emptyEnvironment,
  emptyRepository,
  emptyTechnologyUsage,
  type ApplicationFormValues,
} from '../../schemas/applicationForm';
import {
  APPLICATION_LIFECYCLES,
  APPLICATION_TYPES,
  ENVIRONMENT_STATUSES,
  ENVIRONMENT_TYPES,
  HOSTING_MODELS,
  OPERATIONAL_STATUSES,
  SOURCE_REPOSITORY_TYPES,
} from '../../types';
import {
  APPLICATION_TYPE_LABELS,
  ENVIRONMENT_STATUS_PRESENTATION,
  ENVIRONMENT_TYPE_LABELS,
  HOSTING_MODEL_LABELS,
  LIFECYCLE_PRESENTATION,
  OPERATIONAL_STATUS_PRESENTATION,
  SOURCE_REPOSITORY_TYPE_LABELS,
} from '../../utils/applicationPresentation';

type Props = { control: Control<ApplicationFormValues> };

const options = <T extends string>(values: readonly T[], label: (value: T) => string) =>
  values.map((value) => ({ value, label: label(value) }));

export function ApplicationGeneralSection({ control }: Props) {
  return (
    <SectionCard title="General">
      <div className="c-form-grid c-form-grid--three">
        <TextField
          control={control}
          name="name"
          label="Application name"
          required
          className="c-form-grid__wide"
        />
        <TextField
          control={control}
          name="code"
          label="Code"
          required
          description="Short unique code, e.g. PAYGW."
        />
        <SelectField
          control={control}
          name="type"
          label="Type"
          required
          options={options(APPLICATION_TYPES, (v) => APPLICATION_TYPE_LABELS[v])}
        />
        <SelectField
          control={control}
          name="lifecycle"
          label="Lifecycle"
          required
          options={options(APPLICATION_LIFECYCLES, (v) => LIFECYCLE_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="criticality"
          label="Criticality"
          required
          options={options(CRITICALITIES, (v) => CRITICALITY_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="operationalStatus"
          label="Operational status"
          required
          options={options(OPERATIONAL_STATUSES, (v) => OPERATIONAL_STATUS_PRESENTATION[v].label)}
        />
        <ChipsField control={control} name="tags" label="Tags" className="c-form-grid__wide" />
      </div>
      <div className="c-stack c-form-stack">
        <TextField
          control={control}
          name="shortDescription"
          label="Short description"
          required
          description="One sentence shown in lists and search results."
        />
        <TextField
          control={control}
          name="businessPurpose"
          label="Business purpose"
          rows={2}
          required
          description="Why the application exists, in business terms."
        />
        <TextField
          control={control}
          name="detailedDescription"
          label="Detailed description"
          rows={4}
        />
      </div>
    </SectionCard>
  );
}

export function ApplicationBusinessSection({ control }: Props) {
  const businessUnits = useBusinessUnitOptions();
  return (
    <SectionCard title="Business context">
      <div className="c-form-grid">
        <SelectField
          control={control}
          name="businessUnitId"
          label="Business unit"
          options={businessUnits}
          emptyLabel="Not set"
        />
        <TextField
          control={control}
          name="estimatedUserCount"
          label="Estimated users"
          type="number"
        />
        <ChipsField control={control} name="businessProcesses" label="Business processes" />
        <ChipsField control={control} name="userGroups" label="User groups" />
      </div>
    </SectionCard>
  );
}

export function ApplicationTechnologySection({ control }: Props) {
  const technologies = useTechnologyOptions();
  const usages = useFieldArray({ control, name: 'technologies' });
  const stores = useFieldArray({ control, name: 'dataStores' });
  const hostingModel = useWatch({ control, name: 'hostingModel' });
  const layers = options(TECHNOLOGY_CATEGORIES, (v) => TECHNOLOGY_CATEGORY_LABELS[v]);

  return (
    <>
      <SectionCard
        title="Technology stack"
        description="Technologies from the catalogue and the layer they are used in."
      >
        <RepeatableList
          items={usages.fields}
          onAdd={() => usages.append(emptyTechnologyUsage())}
          onRemove={usages.remove}
          addLabel="Add technology"
          removeLabel={(index) => `Remove technology ${index + 1}`}
          emptyText="No technologies recorded yet."
          renderItem={(index) => (
            <div className="c-form-grid c-form-grid--three">
              <SelectField
                control={control}
                name={`technologies.${index}.technologyId`}
                label="Technology"
                required
                options={technologies}
              />
              <SelectField
                control={control}
                name={`technologies.${index}.layer`}
                label="Layer"
                required
                options={layers}
              />
              <TextField control={control} name={`technologies.${index}.version`} label="Version" />
            </div>
          )}
        />
      </SectionCard>
      <SectionCard
        title="Data stores"
        description="Databases and caches owned by this application."
      >
        <RepeatableList
          items={stores.fields}
          onAdd={() => stores.append(emptyDataStore())}
          onRemove={stores.remove}
          addLabel="Add data store"
          removeLabel={(index) => `Remove data store ${index + 1}`}
          emptyText="No data stores recorded yet."
          renderItem={(index) => (
            <div className="c-form-grid c-form-grid--four">
              <TextField
                control={control}
                name={`dataStores.${index}.name`}
                label="Name"
                required
              />
              <SelectField
                control={control}
                name={`dataStores.${index}.technologyId`}
                label="Technology"
                required
                options={technologies}
              />
              <TextField control={control} name={`dataStores.${index}.purpose`} label="Purpose" />
              <SwitchField
                control={control}
                name={`dataStores.${index}.containsPersonalData`}
                label="Personal data"
              />
            </div>
          )}
        />
      </SectionCard>
      <SectionCard title="Hosting">
        <div className="c-form-grid c-form-grid--three">
          <SelectField
            control={control}
            name="hostingModel"
            label="Hosting model"
            required
            options={options(HOSTING_MODELS, (v) => HOSTING_MODEL_LABELS[v])}
          />
          <TextField
            control={control}
            name="cloudProvider"
            label="Cloud provider"
            required={hostingModel === 'public-cloud' || hostingModel === 'hybrid'}
          />
          <TextField control={control} name="hostingNotes" label="Notes" />
        </div>
      </SectionCard>
    </>
  );
}

export function ApplicationEnvironmentsSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'environments' });
  return (
    <SectionCard
      title="Environments"
      description="URLs and notes only — never credentials. Use the team's secrets manager for those."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyEnvironment())}
        onRemove={remove}
        addLabel="Add environment"
        removeLabel={(index) => `Remove environment ${index + 1}`}
        emptyText="No environments recorded yet."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <SelectField
              control={control}
              name={`environments.${index}.type`}
              label="Type"
              required
              options={options(ENVIRONMENT_TYPES, (v) => ENVIRONMENT_TYPE_LABELS[v])}
            />
            <TextField
              control={control}
              name={`environments.${index}.name`}
              label="Name"
              required
            />
            <SelectField
              control={control}
              name={`environments.${index}.status`}
              label="Status"
              required
              options={options(
                ENVIRONMENT_STATUSES,
                (v) => ENVIRONMENT_STATUS_PRESENTATION[v].label,
              )}
            />
            <TextField
              control={control}
              name={`environments.${index}.url`}
              label="URL"
              type="url"
              placeholder="https://"
            />
            <TextField control={control} name={`environments.${index}.region`} label="Region" />
            <TextField control={control} name={`environments.${index}.notes`} label="Notes" />
          </div>
        )}
      />
    </SectionCard>
  );
}

export function ApplicationRepositoriesSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'repositories' });
  return (
    <SectionCard title="Source repositories">
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyRepository())}
        onRemove={remove}
        addLabel="Add repository"
        removeLabel={(index) => `Remove repository ${index + 1}`}
        emptyText="No repositories linked yet."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--four">
            <TextField
              control={control}
              name={`repositories.${index}.name`}
              label="Name"
              required
              placeholder="group/repository"
            />
            <SelectField
              control={control}
              name={`repositories.${index}.type`}
              label="Type"
              required
              options={options(SOURCE_REPOSITORY_TYPES, (v) => SOURCE_REPOSITORY_TYPE_LABELS[v])}
            />
            <TextField
              control={control}
              name={`repositories.${index}.url`}
              label="Address"
              type="url"
              required
              placeholder="https://"
            />
            <TextField
              control={control}
              name={`repositories.${index}.defaultBranch`}
              label="Default branch"
              required
            />
          </div>
        )}
      />
    </SectionCard>
  );
}
