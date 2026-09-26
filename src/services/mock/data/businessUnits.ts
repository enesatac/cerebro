import type { BusinessUnit } from '@/domains/business-units/types';

export const businessUnits: BusinessUnit[] = [
  {
    id: 'bu-digital-channels',
    code: 'DCH',
    name: 'Dijital Kanallar',
    description: 'Müşteriye yönelik web ve mobil kanallar, e-ticaret ve sadakat.',
    headId: 'person-elif-kaya',
  },
  {
    id: 'bu-finance',
    code: 'FIN',
    name: 'Finans ve Hazine',
    description: 'Ödemeler, muhasebe, mutabakat ve finansal raporlama.',
    headId: 'person-hannah-schulz',
  },
  {
    id: 'bu-operations',
    code: 'OPS',
    name: 'Operasyon',
    description: 'Uçuş, ekip ve yer operasyonlarının planlanması ve kontrolü.',
    headId: 'person-omar-haddad',
  },
  {
    id: 'bu-people-workplace',
    code: 'PWP',
    name: 'İnsan ve Çalışma Ortamı',
    description: 'İK, çalışan hizmetleri ve kurum içi iş birliği.',
    headId: 'person-claire-dubois',
  },
  {
    id: 'bu-technology',
    code: 'TEC',
    name: 'Teknoloji Platformları',
    description: 'Ortak platformlar: kimlik, entegrasyon, veri ve mesajlaşma.',
    headId: 'person-can-ozturk',
  },
];
