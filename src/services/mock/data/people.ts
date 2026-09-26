import type { Person } from '@/domains/people/types';

type PersonSeed = [
  id: string,
  fullName: string,
  jobTitle: string,
  businessUnitId: string,
  location: string,
];

const seeds: PersonSeed[] = [
  ['person-can-ozturk', 'Can Öztürk', 'Chief Technology Officer', 'bu-technology', 'Istanbul'],
  ['person-elif-kaya', 'Elif Kaya', 'Head of Digital Channels', 'bu-digital-channels', 'Istanbul'],
  [
    'person-hannah-schulz',
    'Hannah Schulz',
    'Director of Finance Operations',
    'bu-finance',
    'Frankfurt',
  ],
  ['person-omar-haddad', 'Omar Haddad', 'Head of Operations Control', 'bu-operations', 'Istanbul'],
  [
    'person-claire-dubois',
    'Claire Dubois',
    'Head of People Operations',
    'bu-people-workplace',
    'Paris',
  ],
  ['person-marcus-webb', 'Marcus Webb', 'Principal Architect', 'bu-technology', 'London'],
  ['person-grace-mensah', 'Grace Mensah', 'Security Architect', 'bu-technology', 'London'],
  ['person-selin-aydin', 'Selin Aydın', 'Integration Architect', 'bu-technology', 'Istanbul'],
  [
    'person-aylin-demir',
    'Aylin Demir',
    'Engineering Manager, Platform',
    'bu-technology',
    'Istanbul',
  ],
  ['person-jonas-berg', 'Jonas Berg', 'Senior Software Engineer', 'bu-technology', 'Stockholm'],
  ['person-priya-raman', 'Priya Raman', 'Product Owner, Identity', 'bu-technology', 'London'],
  [
    'person-daniel-okafor',
    'Daniel Okafor',
    'Engineering Manager, Payments',
    'bu-finance',
    'London',
  ],
  ['person-kerem-yildiz', 'Kerem Yıldız', 'Technical Lead, Payments', 'bu-finance', 'Istanbul'],
  ['person-sofia-marin', 'Sofia Marín', 'Product Manager, Payments', 'bu-finance', 'Madrid'],
  ['person-ole-hansen', 'Ole Hansen', 'Finance Systems Lead', 'bu-finance', 'Frankfurt'],
  [
    'person-mehmet-arslan',
    'Mehmet Arslan',
    'Head of Operations Systems',
    'bu-operations',
    'Istanbul',
  ],
  [
    'person-laura-costa',
    'Laura Costa',
    'Technical Lead, Operations Systems',
    'bu-operations',
    'Lisbon',
  ],
  ['person-yuki-tanaka', 'Yuki Tanaka', 'Data Platform Lead', 'bu-technology', 'Amsterdam'],
  [
    'person-ines-ferreira',
    'Inês Ferreira',
    'Engineering Manager, Digital Experience',
    'bu-digital-channels',
    'Lisbon',
  ],
  [
    'person-burak-sahin',
    'Burak Şahin',
    'Frontend Technical Lead',
    'bu-digital-channels',
    'Istanbul',
  ],
  [
    'person-rafael-gomez',
    'Rafael Gómez',
    'Engineering Manager, Commerce',
    'bu-digital-channels',
    'Madrid',
  ],
  [
    'person-emma-lindqvist',
    'Emma Lindqvist',
    'Head of Loyalty',
    'bu-digital-channels',
    'Stockholm',
  ],
  [
    'person-ahmed-nasser',
    'Ahmed Nasser',
    'Workplace Systems Manager',
    'bu-people-workplace',
    'Dubai',
  ],
  ['person-zeynep-celik', 'Zeynep Çelik', 'Programme Manager', 'bu-technology', 'Istanbul'],
  ['person-lucas-moreau', 'Lucas Moreau', 'Project Manager', 'bu-technology', 'Paris'],
  [
    'person-nadia-petrova',
    'Nadia Petrova',
    'Lead Business Analyst',
    'bu-digital-channels',
    'Istanbul',
  ],
  ['person-tom-brennan', 'Tom Brennan', 'Application Support Manager', 'bu-technology', 'Dublin'],
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
