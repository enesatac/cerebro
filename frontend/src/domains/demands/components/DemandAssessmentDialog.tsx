import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@takeoff-ui/react-spar';
import { useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { RecordDialog } from '@/components/forms/RecordDialog';
import { useCurrentUser } from '@/domains/auth/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { useMasterData } from '@/domains/master-data/context';
import { usePersonOptions } from '@/domains/people/api/queries';
import { useProjectOptions } from '@/domains/projects/api/queries';
import { toIsoDate } from '@/lib/dates';
import { formatDecimal } from '@/lib/format';
import { useAssessDemand } from '../api/mutations';
import {
  assessmentFormSchema,
  toAssessmentFormValues,
  toAssessmentInput,
  type AssessmentFormValues,
} from '../schemas/assessmentForm';
import type { Demand, DemandScore, DemandStatus } from '../types';
import {
  EFFORT_CRITERION,
  PRIORITY_THRESHOLDS,
  priorityScore,
  suggestedPriority,
  VALUE_CRITERIA,
} from '../utils/demandScoring';
import { quartersFrom } from '../utils/quarters';
import { ScoreField } from './ScoreField';

interface DemandAssessmentDialogProps {
  demand: Demand;
  /** Opens with this status chosen, e.g. `scheduled` from "Takvime al". */
  status?: DemandStatus;
  onClose: () => void;
}

const SCHEDULE_QUARTERS = 6;

const asScore = (value: string) => (value === '' ? null : (Number(value) as DemandScore));

/** Live WSJF score of the form, with the priority it suggests and a button to adopt it. */
function ScoreSummary({
  control,
  setValue,
}: {
  control: Control<AssessmentFormValues>;
  setValue: UseFormSetValue<AssessmentFormValues>;
}) {
  const masterData = useMasterData();
  const [businessValue, strategicFit, timeCriticality, riskReduction, effort, priority] = useWatch({
    control,
    name: [
      'businessValue',
      'strategicFit',
      'timeCriticality',
      'riskReduction',
      'effort',
      'priority',
    ],
  });
  const score = priorityScore({
    businessValue: asScore(businessValue),
    strategicFit: asScore(strategicFit),
    timeCriticality: asScore(timeCriticality),
    riskReduction: asScore(riskReduction),
    effort: asScore(effort),
  });
  const suggestion = suggestedPriority(score);
  const thresholds = PRIORITY_THRESHOLDS.filter((t) => t.min > 0)
    .map((t) => `${masterData.label('demandPriorities', t.priority)} ≥ ${t.min}`)
    .join(' · ');
  return (
    <div className="c-score-summary" aria-live="polite">
      <div className="c-score-summary__value">
        <span className="c-score-summary__label">Puan (WSJF)</span>
        <strong className="c-score-summary__number">{formatDecimal(score)}</strong>
      </div>
      <div className="c-score-summary__detail">
        {suggestion ? (
          <>
            <span>
              Önerilen öncelik: <MasterBadge list="demandPriorities" code={suggestion} />
            </span>
            {suggestion !== priority && (
              <Button
                size="small"
                variant="neutral"
                appearance="outlined"
                onClick={() => setValue('priority', suggestion, { shouldDirty: true })}
              >
                Önerilen önceliği uygula
              </Button>
            )}
          </>
        ) : (
          <span className="c-muted">Puan için beş ölçütün hepsini puanlayın.</span>
        )}
        <span className="c-muted c-score-summary__hint">
          (İş değeri + Stratejik uyum + Zaman kritikliği + Risk azaltma) ÷ Efor · {thresholds}
        </span>
      </div>
    </div>
  );
}

/** Buttons that fill the planned dates with a whole quarter. */
function QuarterShortcuts({ setValue }: { setValue: UseFormSetValue<AssessmentFormValues> }) {
  const quarters = quartersFrom(toIsoDate(new Date()), SCHEDULE_QUARTERS);
  return (
    <div className="c-quarter-shortcuts" role="group" aria-label="Çeyrek seç">
      <span className="c-muted">Çeyrek seç:</span>
      {quarters.map((quarter) => (
        <Button
          key={quarter.id}
          size="small"
          variant="neutral"
          appearance="outlined"
          onClick={() => {
            setValue('plannedStart', quarter.start, { shouldDirty: true, shouldValidate: true });
            setValue('plannedEnd', quarter.end, { shouldDirty: true, shouldValidate: true });
          }}
        >
          {quarter.label}
        </Button>
      ))}
    </div>
  );
}

function ProjectField({ control }: { control: Control<AssessmentFormValues> }) {
  const projects = useProjectOptions();
  const status = useWatch({ control, name: 'status' });
  if (status !== 'converted') return null;
  return (
    <SelectField
      control={control}
      name="projectId"
      label="Dönüştüğü proje"
      required
      options={projects}
      description="Talebi yürüten proje; talep sayfasından projeye bağlantı verilir."
    />
  );
}

/**
 * The portfolio office's decision on a demand: scores, priority, status, plan and the note the
 * requester sees. Status changes are added to the demand's history.
 */
export function DemandAssessmentDialog({ demand, status, onClose }: DemandAssessmentDialogProps) {
  const me = useCurrentUser();
  const people = usePersonOptions();
  const assess = useAssessDemand(demand.id);
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: toAssessmentFormValues(demand, { status, assessorId: me?.personId }),
    mode: 'onTouched',
  });
  const { control, setValue } = form;
  return (
    <RecordDialog
      open
      wide
      onOpenChange={(open) => !open && onClose()}
      title={`Değerlendir: ${demand.code}`}
      description={demand.title}
      form={form}
      onSubmit={(values) => assess.mutateAsync(toAssessmentInput(values))}
      submitLabel="Değerlendirmeyi kaydet"
    >
      <fieldset className="c-fieldset">
        <legend className="c-fieldset__legend">Puanlama</legend>
        <div className="c-form-grid">
          {VALUE_CRITERIA.map((criterion) => (
            <ScoreField
              key={criterion.key}
              control={control}
              name={criterion.key}
              label={criterion.label}
              description={criterion.hint}
            />
          ))}
          <ScoreField
            control={control}
            name={EFFORT_CRITERION.key}
            label={EFFORT_CRITERION.label}
            description={EFFORT_CRITERION.hint}
          />
        </div>
        <ScoreSummary control={control} setValue={setValue} />
      </fieldset>
      <fieldset className="c-fieldset">
        <legend className="c-fieldset__legend">Karar</legend>
        <div className="c-form-grid">
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            required
            list="demandStatuses"
          />
          <MasterSelectField
            control={control}
            name="priority"
            label="Öncelik"
            list="demandPriorities"
            emptyLabel="Belirlenmedi"
          />
          <SelectField
            control={control}
            name="assessorId"
            label="Değerlendiren"
            options={people}
            emptyLabel="Atanmamış"
          />
          <ProjectField control={control} />
          <TextField
            control={control}
            name="decisionNote"
            label="Karar notu / geri bildirim"
            rows={3}
            className="c-form-grid__wide"
            description="Talep sahibi bu notu görür. Reddederken ve bilgi isterken zorunludur."
          />
        </div>
      </fieldset>
      <fieldset className="c-fieldset">
        <legend className="c-fieldset__legend">Takvim</legend>
        <QuarterShortcuts setValue={setValue} />
        <div className="c-form-grid">
          <DateField control={control} name="plannedStart" label="Planlanan başlangıç" />
          <DateField control={control} name="plannedEnd" label="Planlanan bitiş" />
        </div>
      </fieldset>
    </RecordDialog>
  );
}
