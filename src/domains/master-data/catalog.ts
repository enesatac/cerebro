import {
  APPLICATION_LIFECYCLES,
  APPLICATION_TYPES,
  ENVIRONMENT_STATUSES,
  ENVIRONMENT_TYPES,
  HOSTING_MODELS,
  OPERATIONAL_STATUSES,
  SOURCE_REPOSITORY_TYPES,
} from '@/domains/applications/types';
import {
  DEPENDENCY_TYPES,
  INTEGRATION_FREQUENCIES,
  INTEGRATION_TYPES,
} from '@/domains/connections/types';
import { DECISION_STATUSES } from '@/domains/decisions/types';
import { ESCALATION_STATUSES } from '@/domains/escalations/types';
import {
  APPLICATION_IMPACT_TYPES,
  CONFIDENTIALITY_LEVELS,
  CURRENCIES,
  MILESTONE_STATUSES,
  PROJECT_HEALTHS,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@/domains/projects/types';
import { RISK_CATEGORIES, RISK_STATUSES } from '@/domains/risks/types';
import {
  CRITICALITIES,
  DOCUMENTATION_LINK_TYPES,
  STAKEHOLDER_ROLES,
  TEAM_RESPONSIBILITIES,
} from '@/domains/shared/types';
import { TECHNOLOGY_CATEGORIES, TECHNOLOGY_STATUSES } from '@/domains/technologies/types';
import type { MasterDataListKey } from './types';

export const MASTER_DATA_GROUPS = [
  { id: 'applications', label: 'Uygulamalar' },
  { id: 'technologies', label: 'Teknolojiler' },
  { id: 'projects', label: 'Projeler' },
  { id: 'operations', label: 'Riskler ve kararlar' },
  { id: 'connections', label: 'Bağlantılar' },
  { id: 'shared', label: 'Ortak' },
] as const;
export type MasterDataGroupId = (typeof MASTER_DATA_GROUPS)[number]['id'];

export interface MasterDataListDefinition {
  key: MasterDataListKey;
  label: string;
  description: string;
  group: MasterDataGroupId;
  /**
   * Codes the application logic relies on (e.g. `retired` lifecycle, `production` environment).
   * They cannot be deleted or deactivated; admins can still rename, describe, recolour and reorder.
   */
  systemCodes: readonly string[];
  /** Admins may add their own values (otherwise the list is a fixed workflow/scale). */
  extensible: boolean;
  /** Values are shown as coloured badges. */
  colored: boolean;
  /** Where the list appears, for the admin's orientation. */
  usedIn: string;
}

const define = (definition: MasterDataListDefinition) => definition;

/** The catalogue of administrable lists, in navigation order. */
export const MASTER_DATA_LISTS: readonly MasterDataListDefinition[] = [
  define({
    key: 'applicationLifecycles',
    label: 'Yaşam döngüsü aşamaları',
    description: 'Bir uygulamanın planlamadan emekliliğe kadar geçtiği aşamalar.',
    group: 'applications',
    systemCodes: APPLICATION_LIFECYCLES,
    extensible: false,
    colored: true,
    usedIn: 'Uygulama formu, uygulama listesi filtreleri, gösterge paneli',
  }),
  define({
    key: 'applicationTypes',
    label: 'Uygulama türleri',
    description: 'Uygulamanın teknik türü.',
    group: 'applications',
    systemCodes: APPLICATION_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama formu ve detay sayfası',
  }),
  define({
    key: 'operationalStatuses',
    label: 'Çalışma durumları',
    description: 'Uygulamanın anlık operasyonel durumu (yaşam döngüsünden bağımsız).',
    group: 'applications',
    systemCodes: OPERATIONAL_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Uygulama formu, liste ve detay sayfası',
  }),
  define({
    key: 'hostingModels',
    label: 'Barındırma modelleri',
    description: 'Uygulamanın nerede ve nasıl barındırıldığı.',
    group: 'applications',
    systemCodes: HOSTING_MODELS,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama formu (Barındırma), teknik sekme',
  }),
  define({
    key: 'environmentTypes',
    label: 'Ortam türleri',
    description: 'Geliştirme, test, canlı gibi dağıtım ortamları.',
    group: 'applications',
    systemCodes: ENVIRONMENT_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama formu (Ortamlar), ortamlar sekmesi',
  }),
  define({
    key: 'environmentStatuses',
    label: 'Ortam durumları',
    description: 'Bir dağıtım ortamının erişilebilirlik durumu.',
    group: 'applications',
    systemCodes: ENVIRONMENT_STATUSES,
    extensible: true,
    colored: true,
    usedIn: 'Uygulama formu (Ortamlar), ortamlar sekmesi',
  }),
  define({
    key: 'sourceRepositoryTypes',
    label: 'Kod deposu türleri',
    description: 'Bağlanan kaynak kod depolarının türü.',
    group: 'applications',
    systemCodes: SOURCE_REPOSITORY_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama formu (Kaynak kod depoları), kod depoları sekmesi',
  }),
  define({
    key: 'technologyCategories',
    label: 'Teknoloji kategorileri ve katmanları',
    description:
      'Katalogdaki teknolojilerin kategorisi; uygulamalarda katman olarak da kullanılır.',
    group: 'technologies',
    systemCodes: TECHNOLOGY_CATEGORIES,
    extensible: true,
    colored: false,
    usedIn: 'Teknoloji formu ve kataloğu, uygulama teknoloji yığını',
  }),
  define({
    key: 'technologyStatuses',
    label: 'Teknoloji durumları',
    description: 'Kurumun bir teknolojiye bakışı: tercih edilen, desteklenen, kullanımdan kalkan…',
    group: 'technologies',
    systemCodes: TECHNOLOGY_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Teknoloji formu ve kataloğu, teknoloji riski raporu',
  }),
  define({
    key: 'projectStatuses',
    label: 'Proje durumları',
    description: 'Projenin iş akışındaki yeri.',
    group: 'projects',
    systemCodes: PROJECT_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Proje formu, proje listesi ve filtreleri',
  }),
  define({
    key: 'projectHealths',
    label: 'Proje sağlık durumları',
    description: 'Projenin genel gidişatı.',
    group: 'projects',
    systemCodes: PROJECT_HEALTHS,
    extensible: false,
    colored: true,
    usedIn: 'Proje formu, proje listesi ve filtreleri',
  }),
  define({
    key: 'projectTypes',
    label: 'Proje türleri',
    description: 'Projenin amacına göre sınıflandırılması.',
    group: 'projects',
    systemCodes: PROJECT_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Proje formu ve genel bakış',
  }),
  define({
    key: 'projectPhases',
    label: 'Proje aşamaları',
    description: 'Projenin şu an bulunduğu aşama. Sıra, aşamaların akışını yansıtır.',
    group: 'projects',
    systemCodes: PROJECT_PHASES,
    extensible: true,
    colored: false,
    usedIn: 'Proje formu, proje listesi, temel bilgiler',
  }),
  define({
    key: 'milestoneStatuses',
    label: 'Kilometre taşı durumları',
    description: 'Proje kilometre taşlarının durumu.',
    group: 'projects',
    systemCodes: MILESTONE_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Proje formu (Kilometre taşları), kilometre taşları sekmesi',
  }),
  define({
    key: 'applicationImpactTypes',
    label: 'Uygulama etki türleri',
    description: 'Bir projenin etkilediği uygulamaya ne yaptığı.',
    group: 'projects',
    systemCodes: APPLICATION_IMPACT_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Proje formu (Etkilenen uygulamalar), uygulama projeler sekmesi',
  }),
  define({
    key: 'confidentialityLevels',
    label: 'Gizlilik düzeyleri',
    description: 'Proje bilgilerinin gizlilik sınıfı.',
    group: 'projects',
    systemCodes: CONFIDENTIALITY_LEVELS,
    extensible: true,
    colored: false,
    usedIn: 'Proje formu ve genel bakış',
  }),
  define({
    key: 'currencies',
    label: 'Para birimleri',
    description: 'Proje bütçelerinde kullanılabilecek para birimleri (ISO kodu).',
    group: 'projects',
    systemCodes: CURRENCIES,
    extensible: true,
    colored: false,
    usedIn: 'Proje formu (Finansal bilgiler)',
  }),
  define({
    key: 'riskCategories',
    label: 'Risk kategorileri',
    description: 'Risklerin sınıflandırılması.',
    group: 'operations',
    systemCodes: RISK_CATEGORIES,
    extensible: true,
    colored: false,
    usedIn: 'Risk formu ve risk kayıt defteri',
  }),
  define({
    key: 'riskStatuses',
    label: 'Risk durumları',
    description: 'Riskin yaşam döngüsü. Açık ve izlenen riskler aktif sayılır.',
    group: 'operations',
    systemCodes: RISK_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Risk formu, risk kayıt defteri ve filtreleri',
  }),
  define({
    key: 'escalationStatuses',
    label: 'Eskalasyon durumları',
    description: 'Eskalasyonun yaşam döngüsü. Açık ve devam edenler aktif sayılır.',
    group: 'operations',
    systemCodes: ESCALATION_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Eskalasyon formu, eskalasyon kayıt defteri ve filtreleri',
  }),
  define({
    key: 'decisionStatuses',
    label: 'Karar durumları',
    description: 'Mimari ve iş kararlarının durumu.',
    group: 'operations',
    systemCodes: DECISION_STATUSES,
    extensible: false,
    colored: true,
    usedIn: 'Karar formu ve karar listeleri',
  }),
  define({
    key: 'dependencyTypes',
    label: 'Bağımlılık türleri',
    description: 'Bir uygulamanın diğerine hangi açıdan bağımlı olduğu.',
    group: 'connections',
    systemCodes: DEPENDENCY_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Bağımlılık formu, bağımlılık listeleri',
  }),
  define({
    key: 'integrationTypes',
    label: 'Entegrasyon türleri',
    description: 'Entegrasyonun teknik yöntemi (REST, Kafka, dosya aktarımı…).',
    group: 'connections',
    systemCodes: INTEGRATION_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Entegrasyon formu, entegrasyon listeleri',
  }),
  define({
    key: 'integrationFrequencies',
    label: 'Entegrasyon sıklıkları',
    description: 'Verinin ne sıklıkla aktığı.',
    group: 'connections',
    systemCodes: INTEGRATION_FREQUENCIES,
    extensible: true,
    colored: false,
    usedIn: 'Entegrasyon formu, entegrasyon listeleri',
  }),
  define({
    key: 'criticalities',
    label: 'Kritiklik ölçeği',
    description:
      'Uygulama kritikliği, proje önceliği, risk olasılığı/etkisi/önem derecesi ve bağımlılık etkisi için ortak ölçek.',
    group: 'shared',
    systemCodes: CRITICALITIES,
    extensible: false,
    colored: true,
    usedIn: 'Uygulama, proje, risk, eskalasyon ve bağımlılık formları; tüm listeler',
  }),
  define({
    key: 'stakeholderRoles',
    label: 'Paydaş rolleri',
    description: 'Kişilerin bir uygulama veya projedeki rolü.',
    group: 'shared',
    systemCodes: STAKEHOLDER_ROLES,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama ve proje formları (Kişiler), sahiplik bölümleri',
  }),
  define({
    key: 'teamResponsibilities',
    label: 'Ekip sorumlulukları',
    description: 'Bir ekibin uygulama veya projedeki sorumluluğu.',
    group: 'shared',
    systemCodes: TEAM_RESPONSIBILITIES,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama ve proje formları (Ekipler), ekip sayfaları',
  }),
  define({
    key: 'documentationLinkTypes',
    label: 'Doküman türleri',
    description: 'Dokümantasyon bağlantılarının türü.',
    group: 'shared',
    systemCodes: DOCUMENTATION_LINK_TYPES,
    extensible: true,
    colored: false,
    usedIn: 'Uygulama ve proje formları (Dokümantasyon), dokümantasyon sekmeleri',
  }),
];

const BY_KEY = new Map(MASTER_DATA_LISTS.map((definition) => [definition.key, definition]));

export function getListDefinition(key: MasterDataListKey): MasterDataListDefinition {
  const definition = BY_KEY.get(key);
  if (!definition) throw new Error(`Unknown master data list: ${key}`);
  return definition;
}

export const isSystemCode = (key: MasterDataListKey, code: string) =>
  getListDefinition(key).systemCodes.includes(code);
