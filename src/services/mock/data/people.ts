import type { BusinessUnitId } from '@/domains/business-units/types';
import type { Person } from '@/domains/people/types';
import type { PersonId } from '@/domains/shared/types';
import { BU, PERSON } from './ids';

type PersonSeed = [
  id: PersonId,
  fullName: string,
  jobTitle: string,
  businessUnitId: BusinessUnitId,
  location: string,
];

const seeds: PersonSeed[] = [
  [PERSON.canOzturk, 'Can Öztürk', 'Teknoloji Direktörü (CTO)', BU.technology, 'İstanbul'],
  [PERSON.elifKaya, 'Elif Kaya', 'Dijital Kanallar Direktörü', BU.digitalChannels, 'İstanbul'],
  [PERSON.hannahSchulz, 'Hannah Schulz', 'Finans Operasyonları Direktörü', BU.finance, 'Frankfurt'],
  [PERSON.omarHaddad, 'Omar Haddad', 'Operasyon Kontrol Direktörü', BU.operations, 'İstanbul'],
  [
    PERSON.claireDubois,
    'Claire Dubois',
    'İnsan Operasyonları Direktörü',
    BU.peopleWorkplace,
    'Paris',
  ],
  [PERSON.marcusWebb, 'Marcus Webb', 'Baş Mimar', BU.technology, 'Londra'],
  [PERSON.graceMensah, 'Grace Mensah', 'Güvenlik Mimarı', BU.technology, 'Londra'],
  [PERSON.selinAydin, 'Selin Aydın', 'Entegrasyon Mimarı', BU.technology, 'İstanbul'],
  [PERSON.aylinDemir, 'Aylin Demir', 'Mühendislik Yöneticisi, Platform', BU.technology, 'İstanbul'],
  [PERSON.jonasBerg, 'Jonas Berg', 'Kıdemli Yazılım Mühendisi', BU.technology, 'Stockholm'],
  [PERSON.priyaRaman, 'Priya Raman', 'Ürün Sahibi, Kimlik', BU.technology, 'Londra'],
  [PERSON.danielOkafor, 'Daniel Okafor', 'Mühendislik Yöneticisi, Ödemeler', BU.finance, 'Londra'],
  [PERSON.keremYildiz, 'Kerem Yıldız', 'Teknik Lider, Ödemeler', BU.finance, 'İstanbul'],
  [PERSON.sofiaMarin, 'Sofia Marín', 'Ürün Yöneticisi, Ödemeler', BU.finance, 'Madrid'],
  [PERSON.oleHansen, 'Ole Hansen', 'Finans Sistemleri Lideri', BU.finance, 'Frankfurt'],
  [
    PERSON.mehmetArslan,
    'Mehmet Arslan',
    'Operasyon Sistemleri Direktörü',
    BU.operations,
    'İstanbul',
  ],
  [PERSON.lauraCosta, 'Laura Costa', 'Teknik Lider, Operasyon Sistemleri', BU.operations, 'Lizbon'],
  [PERSON.yukiTanaka, 'Yuki Tanaka', 'Veri Platformu Lideri', BU.technology, 'Amsterdam'],
  [
    PERSON.inesFerreira,
    'Inês Ferreira',
    'Mühendislik Yöneticisi, Dijital Deneyim',
    BU.digitalChannels,
    'Lizbon',
  ],
  [PERSON.burakSahin, 'Burak Şahin', 'Frontend Teknik Lideri', BU.digitalChannels, 'İstanbul'],
  [
    PERSON.rafaelGomez,
    'Rafael Gómez',
    'Mühendislik Yöneticisi, E-Ticaret',
    BU.digitalChannels,
    'Madrid',
  ],
  [PERSON.emmaLindqvist, 'Emma Lindqvist', 'Sadakat Direktörü', BU.digitalChannels, 'Stockholm'],
  [
    PERSON.ahmedNasser,
    'Ahmed Nasser',
    'Çalışma Ortamı Sistemleri Yöneticisi',
    BU.peopleWorkplace,
    'Dubai',
  ],
  [PERSON.zeynepCelik, 'Zeynep Çelik', 'Program Yöneticisi', BU.technology, 'İstanbul'],
  [PERSON.lucasMoreau, 'Lucas Moreau', 'Proje Yöneticisi', BU.technology, 'Paris'],
  [PERSON.nadiaPetrova, 'Nadia Petrova', 'Kıdemli İş Analisti', BU.digitalChannels, 'İstanbul'],
  [PERSON.tomBrennan, 'Tom Brennan', 'Uygulama Destek Yöneticisi', BU.technology, 'Dublin'],
];

function emailFor(fullName: string): string {
  const ascii = fullName.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase();
  return `${ascii.replace(/\s+/g, '.')}@corp.example`;
}

export const people: Person[] = seeds.map(([id, fullName, jobTitle, businessUnitId, location]) => ({
  id,
  fullName,
  jobTitle,
  email: emailFor(fullName),
  businessUnitId,
  location,
}));
