import type { Person } from '@/domains/people/types';

type PersonSeed = [
  id: string,
  fullName: string,
  jobTitle: string,
  businessUnitId: string,
  location: string,
];

const seeds: PersonSeed[] = [
  ['person-can-ozturk', 'Can Öztürk', 'Teknoloji Direktörü (CTO)', 'bu-technology', 'İstanbul'],
  [
    'person-elif-kaya',
    'Elif Kaya',
    'Dijital Kanallar Direktörü',
    'bu-digital-channels',
    'İstanbul',
  ],
  [
    'person-hannah-schulz',
    'Hannah Schulz',
    'Finans Operasyonları Direktörü',
    'bu-finance',
    'Frankfurt',
  ],
  ['person-omar-haddad', 'Omar Haddad', 'Operasyon Kontrol Direktörü', 'bu-operations', 'İstanbul'],
  [
    'person-claire-dubois',
    'Claire Dubois',
    'İnsan Operasyonları Direktörü',
    'bu-people-workplace',
    'Paris',
  ],
  ['person-marcus-webb', 'Marcus Webb', 'Baş Mimar', 'bu-technology', 'Londra'],
  ['person-grace-mensah', 'Grace Mensah', 'Güvenlik Mimarı', 'bu-technology', 'Londra'],
  ['person-selin-aydin', 'Selin Aydın', 'Entegrasyon Mimarı', 'bu-technology', 'İstanbul'],
  [
    'person-aylin-demir',
    'Aylin Demir',
    'Mühendislik Yöneticisi, Platform',
    'bu-technology',
    'İstanbul',
  ],
  ['person-jonas-berg', 'Jonas Berg', 'Kıdemli Yazılım Mühendisi', 'bu-technology', 'Stockholm'],
  ['person-priya-raman', 'Priya Raman', 'Ürün Sahibi, Kimlik', 'bu-technology', 'Londra'],
  [
    'person-daniel-okafor',
    'Daniel Okafor',
    'Mühendislik Yöneticisi, Ödemeler',
    'bu-finance',
    'Londra',
  ],
  ['person-kerem-yildiz', 'Kerem Yıldız', 'Teknik Lider, Ödemeler', 'bu-finance', 'İstanbul'],
  ['person-sofia-marin', 'Sofia Marín', 'Ürün Yöneticisi, Ödemeler', 'bu-finance', 'Madrid'],
  ['person-ole-hansen', 'Ole Hansen', 'Finans Sistemleri Lideri', 'bu-finance', 'Frankfurt'],
  [
    'person-mehmet-arslan',
    'Mehmet Arslan',
    'Operasyon Sistemleri Direktörü',
    'bu-operations',
    'İstanbul',
  ],
  [
    'person-laura-costa',
    'Laura Costa',
    'Teknik Lider, Operasyon Sistemleri',
    'bu-operations',
    'Lizbon',
  ],
  ['person-yuki-tanaka', 'Yuki Tanaka', 'Veri Platformu Lideri', 'bu-technology', 'Amsterdam'],
  [
    'person-ines-ferreira',
    'Inês Ferreira',
    'Mühendislik Yöneticisi, Dijital Deneyim',
    'bu-digital-channels',
    'Lizbon',
  ],
  [
    'person-burak-sahin',
    'Burak Şahin',
    'Frontend Teknik Lideri',
    'bu-digital-channels',
    'İstanbul',
  ],
  [
    'person-rafael-gomez',
    'Rafael Gómez',
    'Mühendislik Yöneticisi, E-Ticaret',
    'bu-digital-channels',
    'Madrid',
  ],
  [
    'person-emma-lindqvist',
    'Emma Lindqvist',
    'Sadakat Direktörü',
    'bu-digital-channels',
    'Stockholm',
  ],
  [
    'person-ahmed-nasser',
    'Ahmed Nasser',
    'Çalışma Ortamı Sistemleri Yöneticisi',
    'bu-people-workplace',
    'Dubai',
  ],
  ['person-zeynep-celik', 'Zeynep Çelik', 'Program Yöneticisi', 'bu-technology', 'İstanbul'],
  ['person-lucas-moreau', 'Lucas Moreau', 'Proje Yöneticisi', 'bu-technology', 'Paris'],
  [
    'person-nadia-petrova',
    'Nadia Petrova',
    'Kıdemli İş Analisti',
    'bu-digital-channels',
    'İstanbul',
  ],
  ['person-tom-brennan', 'Tom Brennan', 'Uygulama Destek Yöneticisi', 'bu-technology', 'Dublin'],
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
