import type { UserAccount } from '@/domains/auth/types';
import { auditOf } from './audit';

type UserSeed = [
  id: string,
  displayName: string,
  role: UserAccount['role'],
  personId: string | null,
  active: boolean,
];

const seeds: UserSeed[] = [
  ['user-can-ozturk', 'Can Öztürk', 'admin', 'person-can-ozturk', true],
  ['user-selin-aydin', 'Selin Aydın', 'admin', 'person-selin-aydin', true],
  ['user-elif-kaya', 'Elif Kaya', 'user', 'person-elif-kaya', true],
  ['user-tom-brennan', 'Tom Brennan', 'user', 'person-tom-brennan', true],
  ['user-nadia-petrova', 'Nadia Petrova', 'user', 'person-nadia-petrova', false],
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
    by: 'person-can-ozturk',
  }),
}));
