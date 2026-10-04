import type { UserAccount, UserAccountId } from '@/domains/auth/types';
import type { PersonId } from '@/domains/shared/types';
import { auditOf } from './audit';
import { PERSON, ROLE, USER } from './ids';

type UserSeed = [
  id: UserAccountId,
  displayName: string,
  roleIds: UserAccount['roleIds'],
  personId: PersonId | null,
  active: boolean,
];

const seeds: UserSeed[] = [
  [USER.canOzturk, 'Can Öztürk', [ROLE.systemAdmin], PERSON.canOzturk, true],
  [USER.selinAydin, 'Selin Aydın', [ROLE.systemAdmin], PERSON.selinAydin, true],
  [USER.elifKaya, 'Elif Kaya', [ROLE.businessUnit, ROLE.employee], PERSON.elifKaya, true],
  [USER.tomBrennan, 'Tom Brennan', [ROLE.manager], PERSON.tomBrennan, true],
  [USER.nadiaPetrova, 'Nadia Petrova', [ROLE.employee], PERSON.nadiaPetrova, false],
  [USER.zeynepCelik, 'Zeynep Çelik', [ROLE.portfolioOffice], PERSON.zeynepCelik, true],
];

const emailFor = (name: string) =>
  `${name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/\s+/g, '.')}@corp.example`;

export const users: UserAccount[] = seeds.map(([id, displayName, roleIds, personId, active]) => ({
  id,
  displayName,
  email: emailFor(displayName),
  roleIds,
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
