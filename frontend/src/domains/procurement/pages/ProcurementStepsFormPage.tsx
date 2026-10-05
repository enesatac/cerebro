import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { QueryView } from '@/components/feedback/QueryView';
import { FormPage } from '@/components/forms/FormPage';
import { parseId } from '@/lib/urlParams';
import { useSaveProcurementSteps } from '../api/mutations';
import { useProcurement } from '../api/queries';
import { StepsFields } from '../components/StepsFields';
import {
  stepsFormSchema,
  toStepDrafts,
  toStepsFormValues,
  type StepsFormValues,
} from '../schemas/stepsForm';
import type { ProcurementProcess } from '../types';

function StepsForm({ process }: { process: ProcurementProcess }) {
  const save = useSaveProcurementSteps(process.contractId);
  const form = useForm<StepsFormValues>({
    resolver: zodResolver(stepsFormSchema),
    defaultValues: toStepsFormValues(process.steps),
    mode: 'onTouched',
  });
  const detail = paths.procurement.detail(process.contractId);
  return (
    <FormPage
      form={form}
      title="Süreç adımlarını düzenle"
      subtitle={`${process.code} · ${process.title}`}
      breadcrumbs={[
        { label: 'Satın alma takibi', to: paths.procurement.list() },
        { label: process.code, to: detail },
        { label: 'Adımlar' },
      ]}
      cancelTo={detail}
      submitLabel="Adımları kaydet"
      onSubmit={async (values) => {
        await save.mutateAsync(toStepDrafts(values));
        return detail;
      }}
    >
      <StepsFields
        control={form.control}
        error={form.formState.errors.steps?.root?.message ?? form.formState.errors.steps?.message}
      />
    </FormPage>
  );
}

export default function ProcurementStepsFormPage() {
  const query = useProcurement(parseId(useParams().contractId) ?? 0);
  return (
    <QueryView
      query={query}
      loadingLabel="Satın alma yükleniyor"
      errorTitle="Bu satın alma yüklenemedi"
    >
      {(process) => <StepsForm process={process} />}
    </QueryView>
  );
}
