import { z } from 'zod';
import {
  childRowId,
  emptyToNull,
  idText,
  optionalDate,
  requiredChoice,
  requiredText,
  requiredUrl,
  secretFreeText,
  toIdOrNull,
} from '@/lib/validation';
import type { Draft, EntityId } from '@/domains/shared/types';
import type { Runbook, RunbookInput, RunbookStep } from '../types';

/** Steps are edited as text, one per line — the fastest way to write a procedure. */
export const stepsToText = (steps: readonly RunbookStep[]) => steps.map((s) => s.text).join('\n');

/** Lines → step rows; numbering such as "1." or "- " at the start of a line is dropped. */
export function textToSteps(text: string): Draft<RunbookStep>[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s+/, '').trim())
    .filter((line) => line !== '')
    .map((line) => ({ id: null, text: line }));
}

const linkSchema = z.object({
  id: childRowId,
  type: requiredChoice('bir tür'),
  label: requiredText('Adres adı', 120),
  url: requiredUrl('Adres'),
  note: secretFreeText('Ne kontrol edilmeli', 300),
});

const contactSchema = z
  .object({
    id: childRowId,
    label: requiredText('Rol / seviye', 120),
    personId: z.string(),
    teamId: z.string(),
    channel: secretFreeText('İletişim', 200),
    when: secretFreeText('Ne zaman aranır', 200),
  })
  .refine((c) => c.personId !== '' || c.teamId !== '' || c.channel.trim() !== '', {
    message: 'Bir kişi, ekip veya iletişim kanalı girin.',
    path: ['channel'],
  });

const scenarioSchema = z.object({
  id: childRowId,
  title: requiredText('Sorun başlığı', 160),
  symptoms: secretFreeText('Belirtiler', 1000),
  steps: secretFreeText('Çözüm adımları', 4000),
});

export const runbookFormSchema = z.object({
  summary: secretFreeText('Ne zaman kullanılır', 1000),
  lastVerifiedOn: optionalDate,
  firstResponse: secretFreeText('İlk müdahale adımları', 4000),
  links: z.array(linkSchema),
  contacts: z.array(contactSchema),
  scenarios: z.array(scenarioSchema),
});

export type RunbookFormValues = z.infer<typeof runbookFormSchema>;

export const emptyRunbookLink = (): RunbookFormValues['links'][number] => ({
  id: null,
  type: 'dashboard',
  label: '',
  url: '',
  note: '',
});

export const emptyRunbookContact = (): RunbookFormValues['contacts'][number] => ({
  id: null,
  label: '',
  personId: '',
  teamId: '',
  channel: '',
  when: '',
});

export const emptyRunbookScenario = (): RunbookFormValues['scenarios'][number] => ({
  id: null,
  title: '',
  symptoms: '',
  steps: '',
});

export function toRunbookFormValues(runbook?: Runbook | null): RunbookFormValues {
  return {
    summary: runbook?.summary ?? '',
    lastVerifiedOn: runbook?.lastVerifiedOn ?? '',
    firstResponse: stepsToText(runbook?.firstResponse ?? []),
    links: (runbook?.links ?? []).map((l) => ({ ...l })),
    contacts: (runbook?.contacts ?? []).map((c) => ({
      ...c,
      personId: idText(c.personId),
      teamId: idText(c.teamId),
    })),
    scenarios: (runbook?.scenarios ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      symptoms: s.symptoms,
      steps: stepsToText(s.steps),
    })),
  };
}

export function toRunbookInput(applicationId: EntityId, values: RunbookFormValues): RunbookInput {
  return {
    applicationId,
    summary: values.summary.trim(),
    lastVerifiedOn: emptyToNull(values.lastVerifiedOn),
    firstResponse: textToSteps(values.firstResponse),
    links: values.links.map((l) => ({
      ...l,
      label: l.label.trim(),
      url: l.url.trim(),
      note: l.note.trim(),
    })),
    contacts: values.contacts.map((c) => ({
      id: c.id,
      label: c.label.trim(),
      personId: toIdOrNull(c.personId),
      teamId: toIdOrNull(c.teamId),
      channel: c.channel.trim(),
      when: c.when.trim(),
    })),
    scenarios: values.scenarios.map((s) => ({
      id: s.id,
      title: s.title.trim(),
      symptoms: s.symptoms.trim(),
      steps: textToSteps(s.steps),
    })),
  };
}
