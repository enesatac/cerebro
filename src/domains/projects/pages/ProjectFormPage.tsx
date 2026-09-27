import { zodResolver } from '@hookform/resolvers/zod';
import type { EntityId } from '@/domains/shared/types';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { StakeholderFields } from '@/domains/people/components/StakeholderFields';
import { DocumentationLinksFields } from '@/domains/shared/components/DocumentationLinksFields';
import { useProject } from '../api/queries';
import { useSaveProject } from '../api/mutations';
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
import { ProjectDeleteAction } from '../components/ProjectDeleteAction';
import { parseId } from '@/lib/urlParams';

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
  const save = useSaveProject(project?.id);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: toProjectFormValues(project),
    mode: 'onTouched',
  });
  const { control } = form;

  return (
    <FormPage
      form={form}
      title={project ? `Düzenle: ${project.name}` : 'Proje oluştur'}
      breadcrumbs={[
        { label: 'Projeler', to: paths.projects.list() },
        ...(project ? [{ label: project.name, to: paths.projects.detail(project.id) }] : []),
        { label: project ? 'Düzenle' : 'Yeni' },
      ]}
      cancelTo={project ? paths.projects.detail(project.id) : paths.projects.list()}
      submitLabel={project ? 'Değişiklikleri kaydet' : 'Proje oluştur'}
      onSubmit={async (values) =>
        paths.projects.detail((await save.mutateAsync(toProjectInput(values))).id)
      }
      deleteAction={
        project && (
          <ProjectDeleteAction
            record={project}
            onDeleted={() => void navigate(paths.projects.list())}
          />
        )
      }
    >
      <ProjectGeneralSection control={control} />
      <StakeholderFields
        control={control}
        roleOrder={PROJECT_ROLE_ORDER}
        description="Önce sponsor, proje yöneticisi ve liderler."
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
  return projectId ? <EditProject id={parseId(projectId) ?? 0} /> : <ProjectForm />;
}

function EditProject({ id }: { id: EntityId }) {
  const query = useProject(id);
  return (
    <QueryView query={query} loadingLabel="Proje yükleniyor" errorTitle="Bu proje yüklenemedi">
      {(project) => <ProjectForm project={project} />}
    </QueryView>
  );
}
