import { describe, expect, it } from 'vitest';
import type { RunbookInput } from '@/domains/runbooks/types';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { APP, PERSON, TEAM, USER } from '@/services/mock/data/ids';
import { createMockRepositories } from './index';

const input = (overrides: Partial<RunbookInput> = {}): RunbookInput => ({
  applicationId: APP.notificationService,
  summary: 'Bildirimler gitmiyorsa.',
  firstResponse: [
    { id: null, text: 'Kuyruk derinliğine bakın' },
    { id: null, text: 'Sağlayıcı durumunu kontrol edin' },
  ],
  links: [
    {
      id: null,
      type: 'dashboard',
      label: 'Pano',
      url: 'https://grafana.corp.example/d/notif',
      note: '',
    },
  ],
  contacts: [
    {
      id: null,
      label: 'Nöbetçi',
      personId: null,
      teamId: TEAM.platform,
      channel: '',
      when: 'Hemen',
    },
  ],
  scenarios: [
    {
      id: null,
      title: 'SMS gecikiyor',
      symptoms: '',
      steps: [{ id: null, text: 'Yedek sağlayıcıya geç' }],
    },
  ],
  lastVerifiedOn: null,
  ...overrides,
});

describe('runbook repository', () => {
  it('returns null for an application without a runbook, and the runbook once written', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    expect(await repos.runbooks.getByApplication(APP.notificationService)).toBeNull();
    const created = await repos.runbooks.create(input());
    const read = await repos.runbooks.getByApplication(APP.notificationService);
    expect(read?.id).toBe(created.id);
    expect(read?.firstResponse.map((s) => s.text)).toEqual([
      'Kuyruk derinliğine bakın',
      'Sağlayıcı durumunu kontrol edin',
    ]);
    expect(read?.scenarios[0]?.steps[0]?.id).toBeGreaterThan(0);
  });

  it('keeps child ids on update and refuses a second runbook for the same application', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const existing = await repos.runbooks.getByApplication(APP.paymentGateway);
    if (!existing) throw new Error('seed runbook missing');
    const updated = await repos.runbooks.update(existing.id, {
      ...existing,
      contacts: [...existing.contacts].reverse(),
    });
    expect(updated.contacts.map((c) => c.id)).toEqual(
      [...existing.contacts].reverse().map((c) => c.id),
    );
    await expect(
      repos.runbooks.create(input({ applicationId: APP.paymentGateway })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses credentials, bad addresses and empty contacts', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    await expect(
      repos.runbooks.create(input({ firstResponse: [{ id: null, text: 'Gir: password=abc123' }] })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repos.runbooks.create(
        input({
          links: [{ id: null, type: 'logs', label: 'Log', url: 'javascript:alert(1)', note: '' }],
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repos.runbooks.create(
        input({
          contacts: [
            { id: null, label: 'Kimse', personId: null, teamId: null, channel: '', when: '' },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      repos.runbooks.create(
        input({
          contacts: [
            { id: null, label: 'X', personId: 99_999, teamId: null, channel: '', when: '' },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('is read-only for regular users', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    expect(await repos.runbooks.getByApplication(APP.paymentGateway)).not.toBeNull();
    await expect(repos.runbooks.create(input())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('goes with its application, and blocks deleting a person it names', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const impact = await repos.people.getDeletionImpact(PERSON.keremYildiz);
    expect(impact.references.some((r) => r.label === 'müdahale rehberi kişisi')).toBe(true);
    await repos.applications.remove(APP.apiGateway);
    expect(await repos.runbooks.getByApplication(APP.apiGateway)).toBeNull();
  });
});
