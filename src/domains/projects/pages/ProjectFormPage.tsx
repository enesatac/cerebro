import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { Can } from '@/domains/auth/components/Can';
import { StakeholderFields } from '@/domains/people/components/StakeholderFields';
import { DocumentationLinksFields } from '@/domains/shared/components/DocumentationLinksFields';
import { useRepositories } from '@/services/RepositoryContext';
import { useProject } from '../api/queries';
import { useDeleteProject, useSaveProject } from '../api/mutations';
import {
  ProjectApplicationsSection,
  ProjectFinancialsSection,
  ProjectGeneralSection,
  ProjectMilestonesSection,
  ProjectProgressSection,
} from '../components/form/ProjectFormSections';
import {
  projectFormSchema,
  toProjectFormValues,
  toProjectInput,
  type ProjectFormValues,
} from '../schemas/projectForm';
import type { Project } from '../types';

const PROJECT_ROLE_ORDER = [
  'sponsor',
  'project-manager',
  'technical-lead',
  'analyst-lead',
  'product-owner',
  'architect',
  'analyst',
  'developer',
  'business-owner',
  'technical-owner',
  'support',
  'stakeholder',
] as const;

function ProjectForm({ project }: { project?: Project }) {
  const navigate = useNavigate();
  const { projects } = useRepositories();
  const save = useSaveProject(project?.id);
  const remove = useDeleteProject();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: toProjectFormValues(project),
    mode: 'onTouched',
  });
  const { control } = form;

  return (
    <FormPage
      form={form}
      title={project ? `Edit ${project.name}` : 'Create project'}
      breadcrumbs={[
        { label: 'Projects', to: paths.projects.list() },
        ...(project ? [{ label: project.name, to: paths.projects.detail(project.id) }] : []),
        { label: project ? 'Edit' : 'New' },
      ]}
      cancelTo={project ? paths.projects.detail(project.id) : paths.projects.list()}
      submitLabel={project ? 'Save changes' : 'Create project'}
      onSubmit={async (values) =>
        paths.projects.detail((await save.mutateAsync(toProjectInput(values))).id)
      }
      deleteAction={
        project && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="project"
              entityName={project.name}
              impactKey={['project', project.id]}
              loadImpact={() => projects.getDeletionImpact(project.id)}
              onDelete={() => remove.mutateAsync(project.id)}
              onDeleted={() => void navigate(paths.projects.list())}
            />
          </Can>
        )
      }
    >
      <ProjectGeneralSection control={control} />
      <StakeholderFields
        control={control}
        roleOrder={PROJECT_ROLE_ORDER}
        description="Sponsor, project manager and leads first."
      />
      <ProjectProgressSection control={control} />
      <ProjectApplicationsSection control={control} />
      <ProjectMilestonesSection control={control} />
      <ProjectFinancialsSection control={control} />
      <DocumentationLinksFields control={control} />
    </FormPage>
  );
}

export default function ProjectFormPage() {
  const { projectId } = useParams();
  return projectId ? <EditProject id={projectId} /> : <ProjectForm />;
}

function EditProject({ id }: { id: string }) {
  const query = useProject(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading project"
      errorTitle="This project could not be loaded"
    >
      {(project) => <ProjectForm project={project} />}
    </QueryView>
  );
}
