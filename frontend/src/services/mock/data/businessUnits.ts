import type { BusinessUnit } from '@/domains/business-units/types';
import { BU, PERSON } from './ids';

export const businessUnits: BusinessUnit[] = [
  {
    id: BU.digitalChannels,
    code: 'DCH',
    name: 'Dijital Kanallar',
    description: 'Müşteriye yönelik web ve mobil kanallar, e-ticaret ve sadakat.',
    headId: PERSON.elifKaya,
  },
  {
    id: BU.finance,
    code: 'FIN',
    name: 'Finans ve Hazine',
    description: 'Ödemeler, muhasebe, mutabakat ve finansal raporlama.',
    headId: PERSON.hannahSchulz,
  },
  {
    id: BU.operations,
    code: 'OPS',
    name: 'Operasyon',
    description: 'Uçuş, ekip ve yer operasyonlarının planlanması ve kontrolü.',
    headId: PERSON.omarHaddad,
  },
  {
    id: BU.peopleWorkplace,
    code: 'PWP',
    name: 'İnsan ve Çalışma Ortamı',
    description: 'İK, çalışan hizmetleri ve kurum içi iş birliği.',
    headId: PERSON.claireDubois,
  },
  {
    id: BU.technology,
    code: 'TEC',
    name: 'Teknoloji Platformları',
    description: 'Ortak platformlar: kimlik, entegrasyon, veri ve mesajlaşma.',
    headId: PERSON.canOzturk,
  },
];
