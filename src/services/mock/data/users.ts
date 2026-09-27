import type { UserAccount, UserAccountId } from '@/domains/auth/types';
import type { PersonId } from '@/domains/shared/types';
import { auditOf } from './audit';
import { PERSON, USER } from './ids';

type UserSeed = [
  id: UserAccountId,
  displayName: string,
  role: UserAccount['role'],
  personId: PersonId | null,
  active: boolean,
];

const seeds: UserSeed[] = [
  [USER.canOzturk, 'Can Öztürk', 'admin', PERSON.canOzturk, true],
  [USER.selinAydin, 'Selin Aydın', 'admin', PERSON.selinAydin, true],
  [USER.elifKaya, 'Elif Kaya', 'user', PERSON.elifKaya, true],
  [USER.tomBrennan, 'Tom Brennan', 'user', PERSON.tomBrennan, true],
  [USER.nadiaPetrova, 'Nadia Petrova', 'user', PERSON.nadiaPetrova, false],
];

const emailFor = (name: string) =>
  `${name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/\s+/g, '.')}@corp.example`;

export const users: UserAccount[] = seeds.map(([id, displayName, role, personId, active]) => ({
  id,
  displayName,
  email: emailFor(displayName),
  role,
  personId,
  active,
  lastSignInAt: active ? '2026-09-25T08:10:00Z' : '2026-03-02T09:00:00Z',
  audit: auditOf({
    created: '2025-06-01',
    updated: '2026-06-01',
    reviewed: null,
    by: PERSON.canOzturk,
  }),
}));
