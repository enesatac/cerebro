import type { Allocation } from '@/domains/resources/types';
import type { PersonId } from '@/domains/shared/types';
import { auditOf } from './audit';
import { PERSON, PRJ } from './ids';

type AllocationSeed = [
  personId: PersonId,
  projectId: number,
  role: string,
  start: string,
  end: string,
  percent: number,
  note?: string,
];

/**
 * Who works on which project, when and how much — around "today" (autumn 2026). Project managers
 * and leads run several projects at once, so some people are deliberately over-allocated.
 */
const seeds: AllocationSeed[] = [
  // Dijital Müşteri Kazanım Dönüşümü (Feb–Dec 2026)
  [PERSON.zeynepCelik, PRJ.digitalOnboarding, 'project-manager', '2026-02-16', '2026-12-18', 50],
  [PERSON.nadiaPetrova, PRJ.digitalOnboarding, 'analyst-lead', '2026-02-16', '2026-10-30', 60],
  [PERSON.jonasBerg, PRJ.digitalOnboarding, 'technical-lead', '2026-03-02', '2026-12-18', 70],
  [PERSON.priyaRaman, PRJ.digitalOnboarding, 'product-owner', '2026-02-16', '2026-12-18', 40],
  [PERSON.burakSahin, PRJ.digitalOnboarding, 'developer', '2026-04-06', '2026-12-11', 80],
  [PERSON.inesFerreira, PRJ.digitalOnboarding, 'developer', '2026-06-01', '2026-11-27', 60],
  // Ödeme Altyapısı Modernizasyonu (Jan 2026 – Mar 2027)
  [PERSON.lucasMoreau, PRJ.paymentModernisation, 'project-manager', '2026-01-05', '2027-03-31', 40],
  [PERSON.keremYildiz, PRJ.paymentModernisation, 'technical-lead', '2026-01-05', '2027-03-31', 80],
  [PERSON.sofiaMarin, PRJ.paymentModernisation, 'product-owner', '2026-01-05', '2027-03-31', 50],
  [
    PERSON.rafaelGomez,
    PRJ.paymentModernisation,
    'developer',
    '2026-09-01',
    '2026-12-18',
    40,
    'Ödeme API geçişi',
  ],
  [PERSON.mehmetArslan, PRJ.paymentModernisation, 'architect', '2026-01-05', '2026-06-30', 30],
  // Sadakat Programı Lansmanı (Feb 2026 – Jan 2027)
  [PERSON.lucasMoreau, PRJ.loyaltyLaunch, 'project-manager', '2026-02-01', '2027-01-29', 40],
  [PERSON.rafaelGomez, PRJ.loyaltyLaunch, 'technical-lead', '2026-02-01', '2027-01-29', 70],
  [PERSON.nadiaPetrova, PRJ.loyaltyLaunch, 'analyst-lead', '2026-09-01', '2027-01-29', 50],
  [PERSON.emmaLindqvist, PRJ.loyaltyLaunch, 'product-owner', '2026-02-01', '2027-01-29', 30],
  [PERSON.danielOkafor, PRJ.loyaltyLaunch, 'developer', '2026-05-04', '2026-12-31', 60],
  // Eski Rezervasyon Sisteminin Emekliye Ayrılması (Oct 2026 – Jun 2027)
  [
    PERSON.zeynepCelik,
    PRJ.legacyBookingRetirement,
    'project-manager',
    '2026-10-01',
    '2027-06-30',
    40,
  ],
  [
    PERSON.rafaelGomez,
    PRJ.legacyBookingRetirement,
    'technical-lead',
    '2026-11-02',
    '2027-06-30',
    50,
  ],
  [PERSON.ahmedNasser, PRJ.legacyBookingRetirement, 'analyst', '2026-10-01', '2027-02-26', 50],
  [PERSON.burakSahin, PRJ.legacyBookingRetirement, 'developer', '2027-01-04', '2027-06-30', 80],
  // Operasyonel Dayanıklılık (Apr–Dec 2026)
  [PERSON.zeynepCelik, PRJ.opsResilience, 'project-manager', '2026-04-15', '2026-12-31', 30],
  [PERSON.lauraCosta, PRJ.opsResilience, 'technical-lead', '2026-04-15', '2026-12-31', 70],
  [PERSON.marcusWebb, PRJ.opsResilience, 'architect', '2026-04-15', '2026-11-30', 40],
  [PERSON.oleHansen, PRJ.opsResilience, 'developer', '2026-06-01', '2026-12-31', 80],
  [
    PERSON.yukiTanaka,
    PRJ.opsResilience,
    'developer',
    '2026-08-03',
    '2026-10-30',
    30,
    'Veri yedekleme',
  ],
  // Yönetim Raporlaması (Nov 2026 – Jun 2027)
  [PERSON.lucasMoreau, PRJ.managementReporting, 'project-manager', '2026-11-02', '2027-06-30', 30],
  [PERSON.yukiTanaka, PRJ.managementReporting, 'technical-lead', '2026-11-02', '2027-06-30', 70],
  [PERSON.nadiaPetrova, PRJ.managementReporting, 'analyst', '2026-11-16', '2027-03-31', 30],
  [PERSON.danielOkafor, PRJ.managementReporting, 'developer', '2027-01-04', '2027-06-30', 60],
  // Çalışan MFA Yaygınlaştırması (completed Mar 2026)
  [PERSON.lucasMoreau, PRJ.workforceMfa, 'project-manager', '2025-09-01', '2026-03-20', 30],
  [PERSON.graceMensah, PRJ.workforceMfa, 'technical-lead', '2025-09-01', '2026-03-20', 60],
  // Bildirim Kanalı Konsolidasyonu (on hold, May–Dec 2026)
  [
    PERSON.lucasMoreau,
    PRJ.notificationConsolidation,
    'project-manager',
    '2026-05-18',
    '2026-12-11',
    20,
  ],
  [
    PERSON.selinAydin,
    PRJ.notificationConsolidation,
    'technical-lead',
    '2026-05-18',
    '2026-12-11',
    50,
  ],
  [
    PERSON.jonasBerg,
    PRJ.notificationConsolidation,
    'developer',
    '2026-09-14',
    '2026-11-13',
    40,
    'Kafka entegrasyonu',
  ],
  [PERSON.graceMensah, PRJ.notificationConsolidation, 'architect', '2026-06-01', '2026-09-30', 20],
];

export const allocations: Allocation[] = seeds.map(
  ([personId, projectId, role, startDate, endDate, percent, note], index) => ({
    id: index + 1,
    personId,
    projectId,
    role,
    startDate,
    endDate,
    percent,
    note: note ?? '',
    audit: auditOf({
      created: '2026-08-20',
      updated: '2026-09-15',
      reviewed: null,
      by: PERSON.zeynepCelik,
    }),
  }),
);
