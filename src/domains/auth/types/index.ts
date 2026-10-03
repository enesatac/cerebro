import type { AuditMetadata, EntityId, IsoDateTime, PersonId } from '@/domains/shared/types';

export type UserAccountId = EntityId;
export type RoleId = EntityId;

/**
 * Access levels, each including the ones before it: `view` (read-only), `edit` (create and
 * change) and `delete`.
 */
export const ACCESS_LEVELS = ['view', 'edit', 'delete'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const PRIVILEGE_GROUPS = [
  { id: 'portfolio', label: 'Portföy' },
  { id: 'organisation', label: 'Organizasyon ve planlama' },
  { id: 'demands', label: 'Talepler' },
  { id: 'administration', label: 'Yönetim' },
] as const;
export type PrivilegeGroupId = (typeof PRIVILEGE_GROUPS)[number]['id'];

/**
 * The privilege catalogue: one module per screen (or family of screens) and the levels it
 * supports, with what each level allows. Privileges are system-defined — code checks them — so
 * they are not master data; roles, which bundle them, are administrable.
 */
export const PRIVILEGE_MODULES = [
  {
    id: 'dashboard',
    label: 'Gösterge paneli',
    group: 'portfolio',
    levels: { view: 'Portföy özetini ve dikkat listesini görür.' },
  },
  {
    id: 'projects',
    label: 'Projeler',
    group: 'portfolio',
    levels: {
      view: 'Projeleri, kilometre taşlarını ve belgeleri görür.',
      edit: 'Proje oluşturur ve düzenler; belge yükler.',
      delete: 'Proje ve proje belgelerini siler.',
    },
  },
  {
    id: 'applications',
    label: 'Uygulamalar',
    group: 'portfolio',
    levels: {
      view: 'Uygulamaları, ortamları ve müdahale rehberlerini görür.',
      edit: 'Uygulama ve müdahale rehberi oluşturur, düzenler; belge yükler.',
      delete: 'Uygulama, rehber ve belgeleri siler.',
    },
  },
  {
    id: 'connections',
    label: 'Bağlantılar',
    group: 'portfolio',
    levels: {
      view: 'Bağımlılıkları, entegrasyonları ve etki analizini görür.',
      edit: 'Bağımlılık ve entegrasyon kaydeder, düzenler.',
      delete: 'Bağımlılık ve entegrasyon siler.',
    },
  },
  {
    id: 'risks',
    label: 'Riskler, eskalasyonlar ve kararlar',
    group: 'portfolio',
    levels: {
      view: 'Risk, eskalasyon ve kararları görür.',
      edit: 'Risk ve karar kaydeder, eskalasyon açar ve günceller.',
      delete: 'Risk, eskalasyon ve kararları siler.',
    },
  },
  {
    id: 'contracts',
    label: 'Satın alma ve sözleşmeler',
    group: 'portfolio',
    levels: {
      view: 'Sözleşmeleri, bedelleri, ödeme planlarını ve tedarikçileri görür.',
      edit: 'Sözleşme ve tedarikçi kaydeder, ödemeleri günceller, sözleşme belgesi yükler.',
      delete: 'Sözleşme, tedarikçi ve sözleşme belgelerini siler.',
    },
  },
  {
    id: 'reports',
    label: 'Raporlar',
    group: 'portfolio',
    levels: { view: 'Rapor ve grafikleri görür, dışa aktarır.' },
  },
  {
    id: 'teams',
    label: 'Ekipler',
    group: 'organisation',
    levels: {
      view: 'Ekipleri ve üyelerini görür.',
      edit: 'Ekip oluşturur, üyeleri ve iletişim bilgilerini düzenler.',
      delete: 'Ekip siler.',
    },
  },
  {
    id: 'people',
    label: 'Kişiler',
    group: 'organisation',
    levels: {
      view: 'Kişi sayfalarını (sorumluluklar, iş yükü) görür.',
      edit: 'Kişi kayıtlarını ekler ve düzenler.',
      delete: 'Kişi kaydı siler.',
    },
  },
  {
    id: 'technologies',
    label: 'Teknolojiler',
    group: 'organisation',
    levels: {
      view: 'Teknoloji kataloğunu ve kullanımını görür.',
      edit: 'Teknoloji ekler ve durumunu değiştirir.',
      delete: 'Teknoloji siler.',
    },
  },
  {
    id: 'resources',
    label: 'Kaynak planı',
    group: 'organisation',
    levels: {
      view: 'Kimin hangi projede çalıştığını ve yükünü görür.',
      edit: 'Kaynak ataması ekler, değiştirir ve kaldırır.',
    },
  },
  {
    id: 'leaves',
    label: 'İzinler',
    group: 'organisation',
    levels: {
      view: 'İzin takvimini görür.',
      edit: 'İzin ekler, değiştirir ve siler.',
    },
  },
  {
    id: 'demands',
    label: 'Talepler',
    group: 'demands',
    levels: {
      view: 'Tüm talepleri ve kararları görür.',
      edit: 'Talep açar; kendi talebini karar verilene kadar düzenler, geri çeker, dosya ekler.',
    },
  },
  {
    id: 'demandManagement',
    label: 'Talep yönetimi',
    group: 'demands',
    levels: {
      view: 'Gelen kutusunu, önceliklendirmeyi ve yol haritasını görür.',
      edit: 'Talepleri değerlendirir, önceliklendirir, takvime alır; her talebi düzenler.',
      delete: 'Talep siler.',
    },
  },
  {
    id: 'masterData',
    label: 'Ana veriler',
    group: 'administration',
    levels: {
      view: 'Değer listelerini ve iş birimlerini görür.',
      edit: 'Değer listelerini ve iş birimlerini düzenler.',
    },
  },
  {
    id: 'users',
    label: 'Kullanıcılar',
    group: 'administration',
    levels: {
      view: 'Kullanıcı hesaplarını ve rollerini görür.',
      edit: 'Kullanıcı ekler, rollerini değiştirir, devre dışı bırakır ve siler.',
    },
  },
  {
    id: 'roles',
    label: 'Roller ve yetkiler',
    group: 'administration',
    levels: {
      view: 'Rolleri ve yetki matrisini görür.',
      edit: 'Rol oluşturur, yetkilerini değiştirir ve siler.',
    },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  group: PrivilegeGroupId;
  levels: Partial<Record<AccessLevel, string>>;
}[];

type Modules = (typeof PRIVILEGE_MODULES)[number];
export type PrivilegeModule = Modules['id'];
/** `<module>:<level>`, only for the levels the module supports (e.g. `projects:delete`). */
export type Privilege = {
  [M in Modules as M['id']]: `${M['id']}:${keyof M['levels'] & AccessLevel}`;
}[PrivilegeModule];

/** Every privilege in catalogue order. */
export const PRIVILEGES = PRIVILEGE_MODULES.flatMap((module) =>
  ACCESS_LEVELS.filter((level) => level in module.levels).map(
    (level) => `${module.id}:${level}` as Privilege,
  ),
);

/**
 * A named bundle of privileges (a row of `roles`, privileges in `role_privileges`). A user's
 * access is the union of their roles. The system role holds everything and cannot be changed, so
 * the system always stays administrable.
 */
export interface Role {
  id: RoleId;
  name: string;
  description: string;
  privileges: Privilege[];
  system: boolean;
  /** Active and inactive accounts holding the role (read model). */
  userCount: number;
  audit: AuditMetadata;
}

export type RoleInput = Pick<Role, 'name' | 'description' | 'privileges'>;

/** A Cerebro login. Optionally linked to the `Person` it represents in the organisation. */
export interface UserAccount {
  id: UserAccountId;
  displayName: string;
  email: string;
  roleIds: RoleId[];
  personId: PersonId | null;
  /** Deactivated accounts cannot sign in; accounts are never hard-deleted (auditability). */
  active: boolean;
  lastSignInAt: IsoDateTime | null;
  audit: AuditMetadata;
}

export type UserAccountInput = Pick<
  UserAccount,
  'displayName' | 'email' | 'roleIds' | 'personId' | 'active'
>;

/** The signed-in account with what its roles allow, resolved by the server. */
export interface SessionUser extends UserAccount {
  roleNames: string[];
  privileges: Privilege[];
}
