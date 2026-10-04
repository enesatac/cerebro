import { Accordion, Button, Checkbox, Field } from '@takeoff-ui/react-spar';
import { useState } from 'react';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { ExternalLink } from '@/components/data-display/ExternalLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SearchField } from '@/components/forms/SearchField';
import { SectionCard } from '@/components/layout/SectionCard';
import type { Application } from '@/domains/applications/types';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import { useTeamsById } from '@/domains/teams/api/queries';
import { formatDate, toIsoDate } from '@/lib/dates';
import type { Runbook, RunbookContact, RunbookStep } from '../types';
import {
  matchScenarios,
  VERIFICATION_PRESENTATION,
  verificationState,
} from '../utils/runbookPresentation';

/** `environmentTypes` system codes whose addresses are worth checking during an incident. */
const INCIDENT_ENVIRONMENTS = new Set(['production', 'disaster-recovery']);

/**
 * First response as a checklist. Ticks live only in this browser tab: they help whoever is
 * handling the incident keep their place, and are not a record of what was done.
 */
function FirstResponse({ steps }: { steps: readonly RunbookStep[] }) {
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());
  const toggle = (id: number, checked: boolean) =>
    setDone((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  return (
    <SectionCard
      title="1 · İlk müdahale"
      description="Sorun fark edildiğinde, nedeni bilinmeden önce sırayla yapın. İşaretler kaydedilmez."
      actions={
        done.size > 0 ? (
          <Button
            size="small"
            variant="neutral"
            appearance="text"
            onClick={() => setDone(new Set())}
          >
            İşaretleri temizle
          </Button>
        ) : undefined
      }
    >
      {steps.length === 0 ? (
        <EmptyState compact title="İlk müdahale adımı yazılmamış" />
      ) : (
        <>
          <p className="c-runbook__progress" aria-live="polite">
            {done.size}/{steps.length} adım tamamlandı
          </p>
          <ol className="c-runbook__checklist">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`c-runbook__check${done.has(step.id) ? ' c-runbook__check--done' : ''}`}
              >
                <span className="c-runbook__number" aria-hidden="true">
                  {index + 1}
                </span>
                <Field className="c-runbook__check-field">
                  <Checkbox
                    checked={done.has(step.id)}
                    onChange={(checked: boolean) => toggle(step.id, checked)}
                  >
                    <Checkbox.Indicator />
                  </Checkbox>
                  <Field.Label>{step.text}</Field.Label>
                </Field>
              </li>
            ))}
          </ol>
        </>
      )}
    </SectionCard>
  );
}

function Contact({ contact, position }: { contact: RunbookContact; position: number }) {
  const people = usePeopleById();
  const teams = useTeamsById();
  const person = contact.personId ? people.data?.get(contact.personId) : undefined;
  const team = contact.teamId ? teams.data?.get(contact.teamId) : undefined;
  return (
    <li className="c-runbook__contact">
      <span className="c-runbook__number" aria-hidden="true">
        {position}
      </span>
      <div className="c-runbook__contact-body">
        <strong>{contact.label}</strong>
        {person && (
          <span>
            <EntityLink to={paths.people.detail(person.id)}>{person.fullName}</EntityLink>
            <span className="c-muted"> · {person.jobTitle} · </span>
            <a className="c-link" href={`mailto:${person.email}`}>
              {person.email}
            </a>
          </span>
        )}
        {team && (
          <span>
            <EntityLink to={paths.teams.detail(team.id)}>{team.name}</EntityLink>
            {team.chatChannel && <span className="c-muted"> · {team.chatChannel}</span>}
            {team.contactEmail && (
              <>
                <span className="c-muted"> · </span>
                <a className="c-link" href={`mailto:${team.contactEmail}`}>
                  {team.contactEmail}
                </a>
              </>
            )}
          </span>
        )}
        {contact.channel && <span className="c-runbook__channel">{contact.channel}</span>}
        {contact.when && <span className="c-muted">Ne zaman: {contact.when}</span>}
      </div>
    </li>
  );
}

function Contacts({ contacts }: { contacts: readonly RunbookContact[] }) {
  return (
    <SectionCard title="2 · Aranacak kişiler" description="Eskalasyon sırasıyla: önce en üstteki.">
      {contacts.length === 0 ? (
        <EmptyState compact title="Aranacak kişi yazılmamış" />
      ) : (
        <ol className="c-runbook__contacts">
          {contacts.map((contact, index) => (
            <Contact key={contact.id} contact={contact} position={index + 1} />
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

function Links({ runbook, application }: { runbook: Runbook; application: Application }) {
  // Incidents happen in production (or its disaster-recovery twin); other environments are noise.
  const environments = application.environments.filter(
    (env) => env.url && INCIDENT_ENVIRONMENTS.has(env.type),
  );
  return (
    <SectionCard
      title="3 · Kontrol edilecek adresler"
      description="Panolar, loglar ve sağlık kontrolleri — her birinde neye bakılacağı yazıyor."
    >
      {runbook.links.length === 0 && environments.length === 0 ? (
        <EmptyState compact title="Kontrol adresi yazılmamış" />
      ) : (
        <ul className="c-runbook__links">
          {runbook.links.map((link) => (
            <li key={link.id} className="c-runbook__link">
              <span className="c-runbook__link-type">
                <MasterLabel list="runbookLinkTypes" code={link.type} />
              </span>
              <ExternalLink href={link.url}>{link.label}</ExternalLink>
              <code className="c-runbook__url">{link.url}</code>
              {link.note && <p className="c-runbook__note">{link.note}</p>}
            </li>
          ))}
          {environments.map((env) => (
            <li key={`env-${env.id}`} className="c-runbook__link c-runbook__link--env">
              <span className="c-runbook__link-type">
                Ortam · <MasterLabel list="environmentTypes" code={env.type} />
              </span>
              <ExternalLink href={env.url ?? ''}>{env.name}</ExternalLink>
              <code className="c-runbook__url">{env.url}</code>
              {env.notes && <p className="c-runbook__note">{env.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Scenarios({ runbook }: { runbook: Runbook }) {
  const [query, setQuery] = useState('');
  const matches = matchScenarios(runbook.scenarios, query);
  return (
    <SectionCard
      title={`4 · Bilinen sorunlar (${runbook.scenarios.length})`}
      description="Belirtiye göre arayın; eşleşen sorunun çözüm adımlarını uygulayın."
    >
      {runbook.scenarios.length === 0 ? (
        <EmptyState compact title="Bilinen sorun yazılmamış" />
      ) : (
        <div className="c-stack c-stack--s">
          <SearchField
            label="Sorun ara"
            placeholder="Hata mesajı, alarm adı veya belirti"
            value={query}
            onCommit={setQuery}
            delayMs={150}
          />
          {matches.length === 0 ? (
            <EmptyState
              compact
              title="Eşleşen bilinen sorun yok"
              description="İlk müdahale adımlarıyla devam edin ve eskalasyon listesindeki kişilere haber verin."
            />
          ) : (
            <Accordion
              multiple
              className="c-decision-list"
              defaultValue={matches.length === 1 ? [matches[0]?.id ?? 0] : []}
              key={matches.map((m) => m.id).join('-')}
            >
              {matches.map((scenario) => (
                <Accordion.Item key={scenario.id} value={scenario.id}>
                  <Accordion.Header>
                    <Accordion.Trigger>
                      <span className="c-decision-list__heading">
                        <span className="c-decision-list__title">{scenario.title}</span>
                        <span className="c-muted">{scenario.steps.length} adım</span>
                      </span>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content>
                    {scenario.symptoms && (
                      <p className="c-runbook__symptoms">
                        <strong>Belirtiler: </strong>
                        {scenario.symptoms}
                      </p>
                    )}
                    <ol className="c-runbook__steps">
                      {scenario.steps.map((step) => (
                        <li key={step.id}>{step.text}</li>
                      ))}
                    </ol>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      )}
    </SectionCard>
  );
}

/** The application's incident playbook, laid out in the order it is used. */
export function RunbookView({
  runbook,
  application,
}: {
  runbook: Runbook;
  application: Application;
}) {
  const people = usePeopleById();
  const today = toIsoDate(new Date());
  const state = verificationState(runbook.lastVerifiedOn, today);
  const presentation = VERIFICATION_PRESENTATION[state];
  const updatedBy = runbook.audit.updatedBy ? people.data?.get(runbook.audit.updatedBy) : undefined;
  return (
    <div className="c-stack">
      <section className="c-runbook__hero" aria-label="Müdahale rehberi özeti">
        <div className="c-runbook__hero-text">
          <h2 className="c-runbook__title">Sorun anında</h2>
          {runbook.summary && <p className="c-runbook__summary">{runbook.summary}</p>}
          <p className="c-runbook__meta">
            <StatusBadge label={presentation.label} variant={presentation.variant} />
            <span className="c-muted">
              Son doğrulama: {formatDate(runbook.lastVerifiedOn, 'yok')} · Son güncelleme:{' '}
              {formatDate(runbook.audit.updatedAt)}
              {updatedBy && ` (${updatedBy.fullName})`}
            </span>
          </p>
        </div>
        <EditAction
          to={paths.applications.editRunbook(application.id)}
          label="Rehberi düzenle"
          privilege="applications:edit"
        />
      </section>
      <div className="c-two-column c-two-column--even">
        <FirstResponse steps={runbook.firstResponse} />
        <Contacts contacts={runbook.contacts} />
      </div>
      <Links runbook={runbook} application={application} />
      <Scenarios runbook={runbook} />
    </div>
  );
}
