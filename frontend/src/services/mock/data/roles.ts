import type { AccessLevel, PrivilegeModule, Role } from '@/domains/auth/types';
import { PRIVILEGE_MODULES } from '@/domains/auth/types';
import { levelsOf, privilegesFor } from '@/domains/auth/utils/permissions';
import { auditOf } from './audit';
import { PERSON, ROLE } from './ids';

type Grants = Partial<Record<PrivilegeModule, AccessLevel>>;

/** Every module at `level` (capped at what each module supports). */
const everything = (level: AccessLevel): Grants =>
  Object.fromEntries(
    PRIVILEGE_MODULES.map((module) => {
      const levels = levelsOf(module.id);
      return [module.id, levels.includes(level) ? level : levels.at(-1)];
    }),
  );

const viewAll = (except: PrivilegeModule[] = []): Grants =>
  Object.fromEntries(
    PRIVILEGE_MODULES.filter((m) => !except.includes(m.id)).map((m) => [m.id, 'view']),
  );

function role(id: number, name: string, description: string, grants: Grants, system = false): Role {
  return {
    id,
    name,
    description,
    system,
    privileges: PRIVILEGE_MODULES.flatMap((m) => privilegesFor(m.id, grants[m.id] ?? null)),
    userCount: 0,
    audit: auditOf({
      created: '2025-06-01',
      updated: '2026-09-01',
      reviewed: null,
      by: PERSON.canOzturk,
    }),
  };
}

const ADMINISTRATION: PrivilegeModule[] = ['users', 'roles'];

/** Seed roles: a locked system administrator plus the typical roles of the organisation. */
export const roles: Role[] = [
  role(
    ROLE.systemAdmin,
    'Sistem yöneticisi',
    'Her ekranda tam yetki; kullanıcıları, rolleri ve ana verileri yönetir. Değiştirilemez.',
    everything('delete'),
    true,
  ),
  role(
    ROLE.portfolioOffice,
    'Portföy ofisi',
    'Portföyü yönetir: projeler, uygulamalar, riskler; talepleri değerlendirir ve takvime alır.',
    {
      ...viewAll(ADMINISTRATION),
      projects: 'delete',
      applications: 'delete',
      releases: 'delete',
      connections: 'delete',
      risks: 'delete',
      teams: 'delete',
      technologies: 'delete',
      people: 'edit',
      resources: 'edit',
      demands: 'edit',
      demandManagement: 'delete',
      contracts: 'delete',
      procurement: 'edit',
      masterData: 'edit',
    },
  ),
  role(
    ROLE.manager,
    'Birim / ekip yöneticisi',
    'Portföyü görür; ekibini, kaynak planını ve izinleri yönetir, talep açar ve risk kaydeder.',
    {
      ...viewAll(['users', 'roles', 'masterData']),
      teams: 'edit',
      resources: 'edit',
      leaves: 'edit',
      releases: 'edit',
      risks: 'edit',
      demands: 'edit',
    },
  ),
  role(
    ROLE.businessUnit,
    'İş birimi kullanıcısı',
    'İş birimi adına talep açar ve izler; projeleri, uygulamaları ve raporları görür.',
    {
      dashboard: 'view',
      projects: 'view',
      applications: 'view',
      releases: 'view',
      reports: 'view',
      procurement: 'view',
      demands: 'edit',
    },
  ),
  role(
    ROLE.employee,
    'Çalışan',
    'Portföyü, ekipleri ve izin takvimini görür; talep açabilir. Kayıtları değiştiremez.',
    {
      dashboard: 'view',
      projects: 'view',
      applications: 'view',
      releases: 'view',
      connections: 'view',
      risks: 'view',
      teams: 'view',
      people: 'view',
      technologies: 'view',
      resources: 'view',
      leaves: 'view',
      demands: 'edit',
    },
  ),
  role(
    ROLE.auditor,
    'Denetçi (salt okunur)',
    'Yönetim ekranları dahil her şeyi görür, hiçbir şeyi değiştiremez.',
    viewAll(),
  ),
];
