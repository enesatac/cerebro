import type { Vendor } from '@/domains/contracts/types';
import { auditOf } from './audit';
import { PERSON, VENDOR } from './ids';

type VendorSeed = [id: number, name: string, taxNumber: string, contact: string, domain: string];

/** Fictional suppliers (example domains only). */
const seeds: VendorSeed[] = [
  [VENDOR.northwind, 'Northwind Yazılım A.Ş.', '6310000001', 'Derya Aksoy', 'northwind.example'],
  [VENDOR.contosoCloud, 'Contoso Cloud Hizmetleri', '2140000002', 'Mark Ellis', 'contoso.example'],
  [VENDOR.fabrikam, 'Fabrikam Donanım Ltd.', '3870000003', 'Okan Tekin', 'fabrikam.example'],
  [VENDOR.atlasConsulting, 'Atlas Danışmanlık', '1050000004', 'Seda Korkmaz', 'atlas.example'],
  [
    VENDOR.kuzeySecurity,
    'Kuzey Güvenlik Teknolojileri',
    '5560000005',
    'Murat Işık',
    'kuzey.example',
  ],
  [VENDOR.tailspinMessaging, 'Tailspin Mesajlaşma', '7720000006', 'Lena Vogt', 'tailspin.example'],
];

const emailOf = (name: string, domain: string) =>
  `${name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/\s+/g, '.')}@${domain}`;

export const vendors: Vendor[] = seeds.map(([id, name, taxNumber, contact, domain]) => ({
  id,
  name,
  taxNumber,
  contactName: contact,
  contactEmail: emailOf(contact, domain),
  contactPhone: '+90 212 000 00 00',
  website: `https://www.${domain}`,
  notes: '',
  audit: auditOf({
    created: '2025-09-01',
    updated: '2026-06-01',
    reviewed: null,
    by: PERSON.zeynepCelik,
  }),
}));
